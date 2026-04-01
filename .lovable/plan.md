## Plano de Implementação - Admin com Upload de PDF

### 1. Banco de Dados
- Criar tabela `user_roles` com enum `app_role` (admin, user)
- Criar tabela `content_uploads` para rastrear PDFs enviados
- Criar tabela `dynamic_flashcards` para flashcards gerados por IA
- Atribuir role admin ao usuário `joaovictorizidro@gmail.com`

### 2. Edge Function - Conversão de PDF
- Criar edge function `convert-pdf` que:
  - Recebe PDF via upload
  - Usa IA (Lovable AI) para extrair conteúdo e gerar flashcards + questões
  - Salva no banco de dados

### 3. Interface Admin
- Criar dashboard admin com layout diferenciado (sidebar, cores distintas)
- Página de upload de PDF com preview de conteúdo gerado
- Gerenciamento de módulos/flashcards existentes
- Estatísticas de uso da plataforma

### 4. Integração
- Mesclar flashcards estáticos (existentes) com dinâmicos (do banco)
- Atualizar componentes de quiz/exam para usar dados do banco também
