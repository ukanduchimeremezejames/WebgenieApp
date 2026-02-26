# FastAPI CRUD com Prisma e MySQL

Este projeto demonstra como criar um servidor FastAPI para realizar operações CRUD (Create, Read, Update, Delete) utilizando Prisma para se conectar a um banco de dados MySQL.

## Pré-requisitos

- Python 3.7+
- MySQL
- Pip (gerenciador de pacotes Python)
- Prisma
- FastAPI
- Uvicorn

## Instalação

### Passo 1: Clonar o Repositório

Clone o repositório para o seu ambiente local:

```bash
git clone https://github.com/samuelrizzo/python-fast-api-prisma-crud
cd fastapi-prisma-crud
```

### Passo 2: Criar um Ambiente Virtual
```bash
Crie um ambiente virtual para isolar as dependências do projeto:

python -m venv venv     # para windows
source venv/bin/activate  # para linux
```
### Passo 3: Instalar as Dependências
```bash
Instale as dependências necessárias:

pip install fastapi uvicorn prisma
```
### Passo 4: Iniciar o projeto
```bash

uvicorn main:app --reload
```
### Passo 5: Testando
```bash
Utilize a documentação do FastAPI, acessando: http://127.0.0.1:8000/docs, e teste com as ferramentas embutidas!
```