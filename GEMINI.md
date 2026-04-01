# Gemini CLI Reminder Extension

## Objetivo
Esta extensão permite que o Gemini CLI crie lembretes e notificações para o usuário. Ela gerencia lembretes que podem ser disparados em horários específicos ou após intervalos de tempo.

## Instruções para o Modelo
- **Criação de Lembretes**: Use a ferramenta `create_reminder` para agendar um lembrete.
- **Listagem**: Use `list_reminders` para mostrar todos os lembretes ativos e seus status.
- **Cancelamento**: Use `cancel_reminder` se o usuário solicitar a remoção de um alerta.
- **Integração**: Esta extensão é focada em notificações imediatas e lembretes simples. Para agendamentos de tarefas complexas e execução de comandos, prefira o `gemini-cli-scheduler`.

## Exemplos de Uso
- "Me lembre de beber água em 20 minutos."
- "Crie um lembrete para a reunião das 15h."
- "Quais são meus lembretes para hoje?"
