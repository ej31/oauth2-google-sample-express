/**
 *
 *  이 코드는 구글 OAuth2 클라이언트 키 및 시크릿 키를 설정해야 실행 할 수 있습니다.
 *  구글에 `구글 OAuth2 로그인 구현` 검색을 통해 키를 발급 받아서 설정해보실 수 있습니다.
 *  아직 익숙하지 않으시다면 넘어가주세요!
 */
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();   // 환경변수 설정 라이브러리

const app = express();
const port = 3000;

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Passport 내에서 GoogleStrategy 사용
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  (accessToken, refreshToken, profile, cb) => {
    // 블랙리스트에 accessToken이 있는지 확인
    if (blacklistedTokens.includes(accessToken)) {
      return cb(new Error("blacklist 등재된 토큰임"), null);
    }
    return cb(null, profile);
  }
));

// express 설정
app.use(session({secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

// blacklist 토큰 저장 리스트 (redis와 같은 외부 DB를 설정하지 않고 변수로 대체)
const blacklistedTokens = ['특정블랙리스트토큰'];

// 메인 페이지 -> 구글 로그인 버튼 노출 시키기
app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/callback',
  passport.authenticate('google', {failureRedirect: '/'}),
  (req, res) => {
    // 구글 로그인 성공시 구글 인증서버에서 이 엔드포인트를 호출함. 로그인한 유저의 profile 페이지로 이동
    res.redirect('/profile');
  });

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`반갑소 👴, ${req.user.emails[0].value}!`);
  } else {
    res.send('인증되지 않은 유저');
  }
});

app.listen(port, () => {});
