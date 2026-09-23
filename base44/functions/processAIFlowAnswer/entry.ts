import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Normalize text for matching
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

// Check if answer matches expected options
function findMatchingAnswer(userMessage, expectedAnswers) {
  if (!expectedAnswers || expectedAnswers.length === 0) return null;
  
  const normalizedMessage = normalizeText(userMessage);
  
  for (const expectedAnswer of expectedAnswers) {
    const normalizedExpected = normalizeText(expectedAnswer);
    
    // Check if expected answer is a substring of user message
    if (normalizedMessage.includes(normalizedExpected)) {
      return expectedAnswer;
    }
    
    // Check if user message contains the expected answer (reverse)
    if (normalizedExpected.includes(normalizedMessage)) {
      return expectedAnswer;
    }
    
    // Split into keywords and check for partial matches
    const expectedKeywords = normalizedExpected.split(/\s+/);
    const messageKeywords = normalizedMessage.split(/\s+/);
    
    // If 2+ key words from expected answer are in message, consider it a match
    const matchingKeywords = expectedKeywords.filter(kw => 
      messageKeywords.some(mkw => mkw.includes(kw) || kw.includes(mkw))
    );
    
    if (matchingKeywords.length >= 2) {
      return expectedAnswer;
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id, user_message } = await req.json();

    if (!conversation_id || !user_message) {
      return Response.json({ error: 'conversation_id and user_message required' }, { status: 400 });
    }

    // Fetch conversation
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: conversation_id });
    if (!conversations.length) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Only process if bot is active
    if (conversation.status !== 'bot_active' || !conversation.ai_flow_id) {
      return Response.json({ success: false, message: 'Bot not active' });
    }

    // Fetch AI flow
    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({ 
      id: conversation.ai_flow_id 
    });
    if (!flows.length) {
      return Response.json({ error: 'AI flow not found' }, { status: 404 });
    }

    const flow = flows[0];
    const currentQuestionIndex = conversation.current_question_index || 0;
    const currentQuestion = flow.qualification_questions?.[currentQuestionIndex];

    if (!currentQuestion) {
      console.log(`[processAIFlowAnswer] No current question at index ${currentQuestionIndex}`);
      return Response.json({ success: false, message: 'No current question' });
    }

    // Try to match user answer with expected answers
    const matchedAnswer = findMatchingAnswer(user_message, currentQuestion.expected_answers);

    if (!matchedAnswer) {
      console.log(`[processAIFlowAnswer] No matching answer for: "${user_message}"`);
      
      // Send clarification message
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: 'Perfeito 😊 Para te orientar melhor, você pode escolher uma das opções abaixo?',
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });

      // Re-send current question with options
      const optionsText = currentQuestion.expected_answers
        .map((opt, idx) => `${idx + 1}. ${opt}`)
        .join('\n');

      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: `${currentQuestion.question}\n\n${optionsText}`,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });

      return Response.json({ 
        success: false, 
        message: 'No match found, clarification sent',
        matched: false
      });
    }

    console.log(`[processAIFlowAnswer] Matched answer: "${matchedAnswer}" for question index ${currentQuestionIndex}`);

    // Update lead field if specified
    if (currentQuestion.field_to_update) {
      const updateData = {};
      updateData[currentQuestion.field_to_update] = matchedAnswer;
      
      await base44.asServiceRole.entities.Lead.update(conversation.lead_id, updateData);
    }

    // Update lead score
    const scoreImpact = currentQuestion.score_impact || 0;
    if (scoreImpact !== 0) {
      const leads = await base44.asServiceRole.entities.Lead.filter({ id: conversation.lead_id });
      const lead = leads[0];
      const newScore = Math.min(100, Math.max(0, (lead.score || 0) + scoreImpact));
      
      // Update temperature based on score
      let temperature = 'cold';
      if (newScore >= flow.hot_lead_threshold) {
        temperature = 'hot';
      } else if (newScore >= flow.warm_lead_threshold) {
        temperature = 'warm';
      }
      
      await base44.asServiceRole.entities.Lead.update(conversation.lead_id, {
        score: newScore,
        temperature: temperature
      });
    }

    // Determine next step
    const nextStep = currentQuestion.next_step;

    if (nextStep === 'handoff') {
      // End AI flow, handoff to agent
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        status: 'waiting_response',
        ai_active: false,
        qualification_complete: true
      });

      // Send handoff message
      const handoffMsg = flow.handoff_message || 'Um agente vai em breve te atender. Obrigado por suas respostas!';
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: handoffMsg,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });

      return Response.json({ 
        success: true, 
        action: 'handoff',
        matched: true
      });
    }

    if (nextStep === 'finish') {
      // End conversation
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        status: 'closed',
        ai_active: false,
        qualification_complete: true
      });

      return Response.json({ 
        success: true, 
        action: 'finish',
        matched: true
      });
    }

    // Find next question by ID or index
    let nextQuestionIndex = currentQuestionIndex + 1;
    let nextQuestion = null;

    if (nextStep && nextStep !== 'handoff' && nextStep !== 'finish') {
      // Find question by ID
      nextQuestionIndex = flow.qualification_questions.findIndex(q => q.id === nextStep);
      if (nextQuestionIndex === -1) {
        nextQuestionIndex = currentQuestionIndex + 1;
      }
    }

    nextQuestion = flow.qualification_questions?.[nextQuestionIndex];

    if (nextQuestion) {
      // Send next question
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: nextQuestion.question,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });

      // Update conversation to next question
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        current_question_index: nextQuestionIndex,
        last_message_preview: nextQuestion.question,
        last_message_at: new Date().toISOString()
      });

      return Response.json({ 
        success: true, 
        action: 'continue',
        next_question_index: nextQuestionIndex,
        matched: true
      });
    } else {
      // No more questions, complete qualification
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        status: 'waiting_response',
        ai_active: false,
        qualification_complete: true
      });

      const completionMsg = flow.handoff_message || 'Obrigado! A qualificação foi concluída. Um agente vai te contatar em breve.';
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: completionMsg,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });

      return Response.json({ 
        success: true, 
        action: 'complete',
        matched: true
      });
    }

  } catch (error) {
    console.error('[processAIFlowAnswer] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});