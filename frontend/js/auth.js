// 인증 관리 클래스
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // 초기화
    init() {
        console.log('AuthManager 초기화 시작');
        
        // 저장된 사용자 정보 로드
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('저장된 토큰:', token ? '있음' : '없음');
        console.log('저장된 사용자 정보:', savedUser);
        
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('사용자 정보 로드 성공:', this.currentUser);
            } catch (error) {
                console.error('사용자 정보 파싱 오류:', error);
                localStorage.removeItem('user');
            }
        }

        // 토큰이 있지만 사용자 정보가 없으면 갱신 시도
        if (token && !this.currentUser) {
            console.log('토큰은 있지만 사용자 정보 없음, 갱신 시도');
            this.refreshUserInfo();
        }
        
        console.log('로그인 상태:', this.isLoggedIn());
    }

    // 토큰 가져오기
    getToken() {
        return localStorage.getItem('token');
    }

    // 토큰 저장
    setToken(token) {
        localStorage.setItem('token', token);
    }

    // 사용자 정보 저장
    setUser(user) {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    // 로그인 상태 확인
    isLoggedIn() {
        return !!this.getToken() && !!this.currentUser;
    }

    // 현재 사용자 가져오기
    getCurrentUser() {
        return this.currentUser;
    }

    // 로그인
    async login(email, password) {
        try {
            console.log('로그인 시도:', email);
            const response = await api.login(email, password);
            console.log('로그인 응답:', response);
            
            // accessToken 저장
            if (response.accessToken) {
                this.setToken(response.accessToken);
                console.log('토큰 저장 완료');
            }
            
            // refreshToken도 저장 (필요시)
            if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken);
                console.log('refreshToken 저장 완료');
            }
            
            // 사용자 정보 저장 (응답에 직접 포함되어 있음)
            const userInfo = {
                userId: response.userId,
                email: response.email,
                nickname: response.nickname
            };
            
            this.setUser(userInfo);
            console.log('사용자 정보 저장 완료:', userInfo);
            console.log('localStorage 확인:', {
                token: localStorage.getItem('token'),
                user: localStorage.getItem('user')
            });

            // UI 업데이트
            this.updateUI();
            console.log('UI 업데이트 완료');
            
            showSuccess('로그인 성공!');
            return true;
        } catch (error) {
            console.error('로그인 실패:', error);
            showError(error.message || '로그인에 실패했습니다.');
            return false;
        }
    }

    // 회원가입
    async signup(email, password, nickname, profileImageUrl) {
        try {
            await api.signup(email, password, nickname, profileImageUrl);
            
            showSuccess('회원가입 성공! 로그인해주세요.');
            return true;
        } catch (error) {
            console.error('회원가입 실패:', error);
            showError(error.message || '회원가입에 실패했습니다.');
            return false;
        }
    }

    // 로그아웃
    async logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('로그아웃 요청 실패:', error);
        }

        // 로컬 데이터 삭제
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.currentUser = null;

        // 홈으로 이동
        window.location.href = '../index.html';
        
        showSuccess('로그아웃 되었습니다.');
    }

    // 사용자 정보 갱신
    async refreshUserInfo() {
        try {
            const user = await api.getCurrentUser();
            this.setUser(user);
            return true;
        } catch (error) {
            console.error('사용자 정보 갱신 실패:', error);
            // 토큰이 유효하지 않으면 로그아웃
            if (error.status === 401 || error.status === 403) {
                this.logout();
            }
            return false;
        }
    }

    // UI 업데이트
    updateUI() {
        console.log('updateUI 호출됨');
        console.log('현재 로그인 상태:', this.isLoggedIn());
        console.log('현재 사용자:', this.currentUser);
        
        const authNav = document.getElementById('authNav');
        if (!authNav) {
            console.error('authNav 엘리먼트를 찾을 수 없습니다!');
            return;
        }
        
        const writePostBtn = document.getElementById('writePostBtn');

        if (this.isLoggedIn()) {
            // 로그인 상태
            console.log('로그인 상태 UI 표시');
            const currentPath = window.location.pathname;
            const isInPagesFolder = currentPath.includes('/pages/');
            const prefix = isInPagesFolder ? '' : 'pages/';

            // nickname만 사용
            const displayName = this.currentUser.nickname || '사용자';
            console.log('표시할 이름:', displayName);

            authNav.innerHTML = `
                <div class="user-info">
                    <span class="greeting">${displayName}님 안녕하세요!</span>
                    <button class="btn btn-logout" id="logoutBtn">로그아웃</button>
                </div>
            `;

            // 로그아웃 버튼 이벤트
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }

            // 글쓰기 버튼 표시
            if (writePostBtn) {
                writePostBtn.style.display = 'block';
            }
        } else {
            // 로그아웃 상태
            console.log('로그아웃 상태 UI 표시');
            const currentPath = window.location.pathname;
            const isInPagesFolder = currentPath.includes('/pages/');
            const prefix = isInPagesFolder ? '' : 'pages/';

            authNav.innerHTML = `
                <a href="${prefix}login.html" class="btn btn-login">로그인</a>
            `;

            // 글쓰기 버튼 숨김
            if (writePostBtn) {
                writePostBtn.style.display = 'none';
            }
        }
        
        console.log('authNav HTML:', authNav.innerHTML);
    }

    // 권한 확인
    checkAuth(callback) {
        if (!this.isLoggedIn()) {
            showError('로그인이 필요합니다.');
            
            // 현재 페이지가 pages 폴더 안인지 확인
            const currentPath = window.location.pathname;
            const isInPagesFolder = currentPath.includes('/pages/');
            const loginUrl = isInPagesFolder ? 'login.html' : 'pages/login.html';
            
            window.location.href = loginUrl;
            return false;
        }
        if (callback) callback();
        return true;
    }
}

// 전역 인증 관리자 인스턴스
const authManager = new AuthManager();