``` mermaid
classDiagram
    class SQLModel {
        <<interface>>
    }

    class User {
        +int id
        +str name
        +str email
        +str hashed_password
        +int republic_id
    }

    class Republic {
        +int id
        +str name
        +str address
        +str invite_code
    }

    class Expense {
        +int id
        +str description
        +float value
        +date due_date
        +int republic_id
        +int paid_by_id
    }

    %% Heranças
    User --|> SQLModel
    Republic --|> SQLModel
    Expense --|> SQLModel

    %% Relacionamentos (1 para Muitos)
    Republic "1" --o "n" User : possui moradores
    Republic "1" --o "n" Expense : gera contas
    User "1" --o "n" Expense : paga/cadastra
```