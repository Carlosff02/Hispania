package com.hispania.presentation.controllers;

import com.hispania.presentation.dto.request.LoginRequest;
import com.hispania.presentation.dto.request.RegistroRequest;
import com.hispania.presentation.dto.response.AuthResponse;
import com.hispania.presentation.dto.response.UsuarioResponse;
import com.hispania.services.interfaces.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de {@code /api/auth}.
 *
 * <p>Devuelven directamente el token, sin cabecera {@code Authorization} ni cookie.
 * El frontend lo guarda y lo envia en cada peticion. El registro devuelve 201 y el
 * login 200, aunque la operacion sea parecida: un alta crea algo y un login no, y
 * un cliente que espera 201 en el login recibiria un error que nunca ocurre.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * {@code POST /api/auth/registro} -&gt; 201.
     *
     * <p>Publico y sin limite de peticiones. Es lo que pide el enunciado, y el
     * riesgo se controla con la normalizacion a minusculas y los CHECK de la base.
     * Si en algun momento hiciera falta limitarlo, el sitio natural es un
     * {@code OncePerRequestFilter}, no este metodo.
     */
    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    /**
     * {@code POST /api/auth/login} -&gt; 200 con token.
     *
     * <p>Un fallo de credenciales produce 401 a traves de
     * {@code GlobalExceptionHandler}.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * {@code GET /api/auth/yo} -&gt; 200 con los datos de la cuenta.
     *
     * <p>Requiere token porque cae en el {@code anyRequest().authenticated()} de
     * {@code SecurityConfig}. El frontend lo llama al arrancar para saber si el
     * token guardado sigue siendo valido y con que rol cuenta.
     *
     * <p>El identificador sale del claim {@code uid} del token, no de un parametro
     * en la URL. Si fuera un parametro, cualquier usuario autenticado podria
     * preguntar por la cuenta de otro con un 200.
     */
    @GetMapping("/yo")
    public ResponseEntity<UsuarioResponse> yo(@AuthenticationPrincipal Jwt jwt) {
        Long id = Long.valueOf(jwt.getClaim("uid").toString());
        return ResponseEntity.ok(authService.usuarioActual(id));
    }
}
