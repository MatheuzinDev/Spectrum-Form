import { zodResolver } from '@hookform/resolvers/zod';
import {
  createClientSchema,
  type ClientResponse,
  type CreateClientData,
  type CreateClientInput,
} from '@repo/shared';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { maskCpf } from '@/lib/cpf-mask';
import { createClient } from '@/services/client.service';
import { ApiError } from '@/services/http';

import { ColorPicker } from './ColorPicker';

const NOTES_MAX_LENGTH = 500;

const EMPTY_FORM: CreateClientInput = {
  fullName: '',
  cpf: '',
  email: '',
  colorId: 0,
  notes: '',
};

type ClientFormProps = {
  onCreated: (client: ClientResponse) => void;
  onColorChange: (colorId: number | null) => void;
};

function isFormField(name: string): name is keyof CreateClientInput {
  return name in EMPTY_FORM;
}

export function ClientForm({ onCreated, onColorChange }: ClientFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateClientInput, unknown, CreateClientData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onBlur',
  });

  const colorId = useWatch({ control: form.control, name: 'colorId' });
  const notes = useWatch({ control: form.control, name: 'notes' }) ?? '';

  useEffect(() => {
    onColorChange(colorId > 0 ? colorId : null);
  }, [colorId, onColorChange]);

  async function onSubmit(values: CreateClientData) {
    setSubmitError(null);

    try {
      onCreated(await createClient(values));
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }

      const fields = Object.entries(error.fields).filter(([name]) => isFormField(name));

      for (const [name, message] of fields) {
        form.setError(name as keyof CreateClientInput, { message });
      }

      if (fields.length === 0) {
        setSubmitError(error.message);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Como está no documento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="font-mono tabular-nums"
                  {...field}
                  onChange={(event) => {
                    field.onChange(maskCpf(event.target.value));
                  }}
                />
              </FormControl>
              <FormDescription>Onze dígitos. A pontuação é só para leitura.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com.br"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ColorPicker
                  value={field.value > 0 ? field.value : null}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={NOTES_MAX_LENGTH}
                  placeholder="Algo que a gente deva saber. Pode deixar em branco."
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-right font-mono tabular-nums">
                {notes.length}/{NOTES_MAX_LENGTH}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError !== null && (
          <p role="alert" className="text-sm text-bad">
            {submitError}
          </p>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Enviando…' : 'Enviar cadastro'}
          </Button>
          <small className="text-muted-text">Confira o CPF antes de enviar.</small>
        </div>
      </form>
    </Form>
  );
}
