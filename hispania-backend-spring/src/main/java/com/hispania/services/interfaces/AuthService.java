package com.hispania.services.interfaces;

import com.hispania.presentation.dto.request.LoginRequest;
import com.hispania.presentation.dto.request.RegistroRequest;
import com.hispania.presentation.dto.response.AuthResponse;
import com.hispania.presentation.dto.response.UsuarioResponse;

/**
 * Alta de cuentas, inicio de sesion y consulta del perfil propio.
 */
public interface AuthService {

    /** Registra una cuenta nueva con rol USUARIO y devuelve su token. */
    AuthResponse registrar(RegistroRequest request);

    /** Comprueba las credenciales y devuelve un token nuevo. */
    AuthResponse login(LoginRequest request);

    /** Datos de la cuenta a la que pertenece el token de la peticion. */
    UsuarioResponse usuarioActual(Long id);
}
