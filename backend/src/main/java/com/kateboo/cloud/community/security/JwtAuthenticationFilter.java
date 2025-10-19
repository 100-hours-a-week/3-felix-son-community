package com.kateboo.cloud.community.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 디버깅: 요청 정보 로그
            log.info("=== JWT Authentication Filter 실행 ===");
            log.info("요청 URI: {}", request.getRequestURI());
            log.info("요청 메소드: {}", request.getMethod());
            log.info("Authorization 헤더: {}", request.getHeader("Authorization"));

            String jwt = extractToken(request);
            log.info("추출된 JWT 토큰: {}", jwt != null ? jwt.substring(0, Math.min(20, jwt.length())) + "..." : "null");

            if (StringUtils.hasText(jwt)) {
                log.info("JWT 토큰 검증 시작");
                boolean isValid = jwtTokenProvider.validateToken(jwt);
                log.info("JWT 토큰 유효성: {}", isValid);

                if (isValid) {
                    UUID userId = jwtTokenProvider.getUserIdFromToken(jwt);
                    log.info("추출된 사용자 ID: {}", userId);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,
                                    null,
                                    Collections.emptyList()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("인증 정보 설정 완료. 현재 인증 상태: {}",
                            SecurityContextHolder.getContext().getAuthentication() != null);
                } else {
                    log.warn("JWT 토큰이 유효하지 않습니다");
                }
            } else {
                log.warn("JWT 토큰이 없습니다");
            }
        } catch (Exception e) {
            log.error("인증 정보를 설정할 수 없습니다", e);
            log.error("예외 상세: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}