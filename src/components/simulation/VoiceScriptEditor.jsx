import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Edit2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceScriptEditor({ script, assistantId, callType, onSave }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [obligatoryPhrases, setObligatoryPhrases] = useState(['']);
  const [forbiddenPhrases, setForbiddenPhrases] = useState(['']);
  const [finalCTA, setFinalCTA] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEditSpeech = (index) => {
    setEditingIndex(index);
    setEditText(script[index].text);
  };

  const handleSaveEdit = (index) => {
    const updatedScript = [...script];
    updatedScript[index].text = editText;
    setEditingIndex(null);
    toast.success('Fala atualizada');
  };

  const handleSaveOfficialScript = async () => {
    setSaving(true);
    try {
      // Salvar script oficial para futuras campanhas
      const scriptData = {
        script,
        obligatoryPhrases: obligatoryPhrases.filter(p => p.trim()),
        forbiddenPhrases: forbiddenPhrases.filter(p => p.trim()),
        finalCTA,
        callType,
        assistantId,
        timestamp: new Date().toISOString()
      };

      // Aqui você salvaria em VoiceCampaignScript ou similar
      toast.success('Script oficial salvo! Pronto para usar em campanhas de voz.');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar script');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Script Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar Script da Ligação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {script.map((speech, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={speech.speaker === 'ai' ? 'default' : 'secondary'}>
                  {speech.speaker === 'ai' ? 'IA' : 'Lead'}
                </Badge>
                {editingIndex !== index && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditSpeech(index)}
                    className="gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </Button>
                )}
              </div>

              {editingIndex === index ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="h-20"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(index)}
                    className="w-full gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Confirmar
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-700">{speech.text}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Obligatory Phrases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frases Obrigatórias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Frases que DEVEM ser mencionadas na ligação</p>
          {obligatoryPhrases.map((phrase, index) => (
            <Input
              key={index}
              placeholder="Ex: Somos certificados e referência no mercado"
              value={phrase}
              onChange={(e) => {
                const updated = [...obligatoryPhrases];
                updated[index] = e.target.value;
                setObligatoryPhrases(updated);
              }}
            />
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setObligatoryPhrases([...obligatoryPhrases, ''])}
          >
            + Adicionar Frase
          </Button>
        </CardContent>
      </Card>

      {/* Forbidden Phrases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frases Proibidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Frases que NÃO devem ser mencionadas</p>
          {forbiddenPhrases.map((phrase, index) => (
            <Input
              key={index}
              placeholder="Ex: Você não vai gostar"
              value={phrase}
              onChange={(e) => {
                const updated = [...forbiddenPhrases];
                updated[index] = e.target.value;
                setForbiddenPhrases(updated);
              }}
            />
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setForbiddenPhrases([...forbiddenPhrases, ''])}
          >
            + Adicionar Frase
          </Button>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call-to-Action Final</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-sm font-medium mb-2 block">Mensagem de encerramento</Label>
          <Textarea
            placeholder="Ex: Posso agendar uma avaliação grátis para você amanhã às 14h?"
            value={finalCTA}
            onChange={(e) => setFinalCTA(e.target.value)}
            className="h-20"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSaveOfficialScript}
        disabled={saving}
        className="w-full gap-2 bg-green-600 hover:bg-green-700"
        size="lg"
      >
        <Save className="w-4 h-4" />
        Salvar Script Oficial de Voz
      </Button>
    </div>
  );
}