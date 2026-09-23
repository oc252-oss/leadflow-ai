import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id, lead_id, message_content } = await req.json();

    console.log('Processing AI conversation:', { conversation_id, lead_id });

    // Get conversation and flow
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: conversation_id });
    if (conversations.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const conversation = conversations[0];

    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({ id: conversation.ai_flow_id });
    if (flows.length === 0) {
      console.log('No AI flow found');
      return Response.json({ success: true, message: 'No AI flow' });
    }
    const flow = flows[0];

    // Get lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    console.log('Flow:', flow.name, 'Step:', conversation.qualification_step);

    // Get qualification questions
    const questions = flow.qualification_questions || [];
    const currentStep = conversation.qualification_step || 0;

    let aiResponse = '';
    let shouldHandoff = false;
    let scoreChange = 0;

    // Process current question response
    if (currentStep > 0 && currentStep <= questions.length) {
      const previousQuestion = questions[currentStep - 1];
      console.log('Processing answer to:', previousQuestion.question);

      // Simple answer matching - check if any expected answer is mentioned
      if (previousQuestion.expected_answers && previousQuestion.expected_answers.length > 0) {
        const normalizedContent = message_content.toLowerCase();
        const matchedAnswer = previousQuestion.expected_answers.find(ans => 
          normalizedContent.includes(ans.toLowerCase())
        );

        if (matchedAnswer) {
          scoreChange = previousQuestion.score_impact || 10;
          console.log('Matched answer, score change:', scoreChange);

          // Update lead field if specified
          if (previousQuestion.field_to_update) {
            const updateData = {};
            updateData[previousQuestion.field_to_update] = matchedAnswer;
            await base44.asServiceRole.entities.Lead.update(lead_id, updateData);
          }
        }
      }

      // Update lead score
      const newScore = Math.max(0, Math.min(100, (lead.score || 0) + scoreChange));
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        score: newScore,
        temperature: newScore >= flow.hot_lead_threshold ? 'hot' : 
                    newScore >= flow.warm_lead_threshold ? 'warm' : 'cold'
      });

      // Check if we should handoff based on next_step
      if (previousQuestion.next_step === 'handoff') {
        shouldHandoff = true;
      }
    }

    // Determine next action
    if (shouldHandoff || currentStep >= questions.length) {
      // Flow complete or handoff triggered
      console.log('Flow complete or handoff triggered');
      
      aiResponse = flow.handoff_message || 'Obrigado! Em breve um especialista entrará em contato.';
      
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        status: 'human_active',
        qualification_complete: true,
        qualification_step: currentStep
      });

      // Auto-assign if hot lead
      if (lead.score >= flow.hot_lead_threshold && flow.auto_assign_hot_leads) {
        console.log('Auto-assigning hot lead');
        const agents = await base44.asServiceRole.entities.TeamMember.filter({
          company_id: conversation.company_id,
          role: flow.auto_assign_agent_role || 'sales_agent',
          status: 'active'
        }, 'assigned_leads_count', 1);

        if (agents.length > 0) {
          await base44.asServiceRole.entities.Lead.update(lead_id, {
            assigned_agent_id: agents[0].id
          });
          await base44.asServiceRole.entities.Conversation.update(conversation_id, {
            assigned_agent_id: agents[0].id
          });
        }
      }
    } else {
      // Ask next question
      const nextQuestion = questions[currentStep];
      aiResponse = nextQuestion.question;
      
      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        qualification_step: currentStep + 1
      });
    }

    console.log('AI Response:', aiResponse);

    // Send AI response
    if (aiResponse) {
      const botMessage = await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: lead_id,
        sender_type: 'bot',
        content: aiResponse,
        message_type: 'text',
        direction: 'outbound',
        delivered: false,
        read: false
      });

      // Get WhatsApp integration to send message
      const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
        company_id: conversation.company_id,
        is_active: true
      });

      if (integrations.length > 0) {
        await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
          integration_id: integrations[0].id,
          to: lead.phone,
          message: aiResponse,
          message_id: botMessage.id
        });
      }
    }

    // Create activity log
    await base44.asServiceRole.entities.ActivityLog.create({
      company_id: conversation.company_id,
      lead_id: lead_id,
      action: scoreChange > 0 ? 'score_updated' : 'message_sent',
      details: {
        score_change: scoreChange,
        new_score: lead.score + scoreChange,
        flow_step: currentStep
      }
    });

    return Response.json({ 
      success: true,
      ai_response: aiResponse,
      handoff: shouldHandoff
    });

  } catch (error) {
    console.error('Error processing AI conversation:', error);
    return Response.json({ 
      error: 'Failed to process conversation',
      details: error.message 
    }, { status: 500 });
  }
});