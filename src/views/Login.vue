<template>
    <div class="login-container">
      <form @submit.prevent="loginUser">
        <div class="form-group">
          <label for="username">用户名</label>
          <input type="text" id="username" v-model="loginForm.username" required>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="loginForm.password" required>
        </div>
        <button type="submit">登录</button>
        <p v-if="error">{{ error }}</p>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        loginForm: {
          username: '',
          password: '',
        },
        error: '',
      };
    },
    methods: {
      loginUser() {
        const { username, password } = this.loginForm;
        axios.post('http://localhost:3000/api/login', { username, password }) // 修改这里
          .then(response => {
            if (response.data && response.data.message === '登录成功') {
              // 假设后端返回的token在response.data.data.token
              const token = response.data.data.token;
              if (token) {
                localStorage.setItem('user-token', token);
                // 更新请求头，以便之后的所有请求都带有token
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              }
              // 导航到主页或其他需要去的路由
              // this.$router.push('/'); // 取消注释以启用路由跳转
              this.error = ''; // 清除任何已有的错误信息
            } else {
              this.error = '用户名或密码错误';
            }
          })
          .catch(err => {
            if (err.response) {
              this.error = err.response.data.message || '登录失败';
            } else {
              this.error = '网络错误';
            }
          });
      },
    },
  };
  </script>