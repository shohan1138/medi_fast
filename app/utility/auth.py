from datetime import datetime, timedelta
from jose import JWTError,jwt
from passlib.context import CryptContext

SECRET_KEY="change_this_to_a_long_random_secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60*24
pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password:str)-> str:
    return pwd_context.hash(password[:72])

def verify_password(plain:str,hashed:str) ->bool:
    return pwd_context.verify(plain[:72],hashed)

def create_access_token(data:dict) ->str:
    to_encode=data.copy()
    expire=datetime.utcnow()+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

def decode_token(token:str) ->dict:
    try:
        payload =jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        print("Decode Payload:", payload)
        return payload
    except JWTError as e:
        print("jwt Error:", e)
        return None