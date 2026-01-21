import string
import secrets

def gerar_codigo_convite(nome_republica: str):
    # 1. Remove espaços e pega as 3 primeiras letras em maiúsculo
    prefixo = "".join(nome_republica.split())[:3].upper()
    
    # 2. Gera 4 caracteres aleatórios (letras e números)
    # Evitamos 'I', 'L', '1', '0', 'O' para não confundir o usuário ao digitar
    alfabeto = string.ascii_uppercase + string.digits
    sufixo = ''.join(secrets.choice(alfabeto) for _ in range(4))
    
    return f"REP-{prefixo}-{sufixo}"