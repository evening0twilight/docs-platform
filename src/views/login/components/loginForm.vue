<template>
  <div class="login-container animated-background">
    <svg style="display: none">
      <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100"
          lighting-color="white" result="specLight">
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
        <feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>

    <!-- 表单容器包裹器 -->
    <div class="form-wrapper">
      <div class="form-container" :style="{ transform: `translateX(${translateX}%)` }">
        <!-- 忘记密码表单 -->
        <div class="glass-component forgot-password-card" ref="forgotPasswordCard">
          <div class="glass-effect"></div>
          <div class="glass-tint"></div>
          <div class="glass-shine"></div>
          <div class="glass-content">
            <h2 class="login-title">重置密码</h2>
            <form @submit.prevent="handleResetPassword">
              <div class="form-group">
                <input type="email" placeholder="邮箱" class="glass-input" v-model="resetPasswordForm.email" required>
              </div>
              <div class="form-group verification-group">
                <input type="text" placeholder="验证码" class="glass-input verification-input"
                  v-model="resetPasswordForm.code" required maxlength="6">
                <button type="button" class="code-button" @click="sendResetCode"
                  :disabled="resetCodeSending || resetCountdown > 0">
                  {{ resetCodeButtonText }}
                </button>
              </div>
              <div class="form-group password-group">
                <input :type="showResetNewPassword ? 'text' : 'password'" placeholder="新密码（至少6位）" class="glass-input"
                  v-model="resetPasswordForm.newPassword" required minlength="6">
                <button type="button" class="toggle-password" @click="showResetNewPassword = !showResetNewPassword">
                  {{ showResetNewPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <div class="form-group password-group">
                <input :type="showResetConfirmPassword ? 'text' : 'password'" placeholder="确认密码" class="glass-input"
                  :class="{ 'input-error': resetPasswordForm.confirmPassword && resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword }"
                  v-model="resetPasswordForm.confirmPassword" required>
                <button type="button" class="toggle-password"
                  @click="showResetConfirmPassword = !showResetConfirmPassword">
                  {{ showResetConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <div
                v-if="resetPasswordForm.confirmPassword && resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword"
                class="inline-error">
                ⚠️ 两次输入的密码不一致
              </div>
              <div class="form-group button-group">
                <button type="button" class="glass-button cancel-button" @click="cancelReset">
                  取消
                </button>
                <button type="submit" class="glass-button" :disabled="!isResetFormValid || loading">
                  {{ loading ? '重置中...' : '确定' }}
                </button>
              </div>
              <div v-if="resetPasswordErrorMessage" class="error-message">
                {{ resetPasswordErrorMessage }}
              </div>
            </form>
          </div>
        </div>

        <!-- 登录表单 -->
        <div class="glass-component login-card" ref="loginCard">
          <div class="glass-effect"></div>
          <div class="glass-tint"></div>
          <div class="glass-shine"></div>
          <div class="glass-content">
            <h2 class="login-title">欢迎登录</h2>

            <!-- 登录方式切换 -->
            <div class="login-type-tabs">
              <button type="button" :class="['tab-btn', { active: loginType === 'username' }]"
                @click="loginType = 'username'">
                用户名登录
              </button>
              <button type="button" :class="['tab-btn', { active: loginType === 'email' }]"
                @click="loginType = 'email'">
                邮箱登录
              </button>
            </div>

            <form @submit.prevent="handleLogin">
              <!-- 用户名登录 -->
              <template v-if="loginType === 'username'">
                <div class="form-group">
                  <input type="text" placeholder="用户名" class="glass-input" v-model="loginForm.username" required>
                </div>
              </template>

              <!-- 邮箱登录 -->
              <template v-else>
                <div class="form-group">
                  <input type="email" placeholder="邮箱" class="glass-input" v-model="loginForm.email" required>
                </div>
              </template>

              <div class="form-group password-group">
                <input :type="showLoginPassword ? 'text' : 'password'" placeholder="密码" class="glass-input"
                  v-model="loginForm.password" required>
                <button type="button" class="toggle-password" @click="showLoginPassword = !showLoginPassword">
                  {{ showLoginPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <button type="submit" class="glass-button" :disabled="loading">
                {{ loading ? '登录中...' : '登录' }}
              </button>
              <div v-if="loginErrorMessage" class="error-message">
                {{ loginErrorMessage }}
              </div>
            </form>
            <div class="forgot-password-link">
              <span class="link-btn" @click="switchToForgotPassword">忘记密码？</span>
            </div>
            <div class="switch-form">
              还没有账号？
              <span class="switch-btn" @click="switchToRegister">
                注册
                <span class="register-arrow">→</span>
              </span>
            </div>

          </div>
        </div>

        <!-- 注册表单 -->
        <div class="glass-component register-card" ref="registerCard">
          <div class="glass-effect"></div>
          <div class="glass-tint"></div>
          <div class="glass-shine"></div>
          <div class="glass-content">
            <h2 class="login-title">欢迎注册</h2>
            <form @submit.prevent="handleRegister">
              <div class="form-group">
                <input type="email" placeholder="邮箱" class="glass-input" v-model="registerForm.email" required>
                <div class="email-tip">
                  💡 当前仅支持 QQ 邮箱和 163 邮箱
                </div>
              </div>
              <div class="form-group verification-group">
                <input type="text" placeholder="验证码" class="glass-input verification-input" v-model="registerForm.code"
                  required maxlength="6">
                <button type="button" class="code-button" @click="sendCode" :disabled="codeSending || countdown > 0">
                  {{ codeButtonText }}
                </button>
              </div>
              <div class="form-group">
                <input type="text" placeholder="用户名" class="glass-input" v-model="registerForm.username" required>
              </div>
              <div class="form-group password-group">
                <input :type="showRegisterPassword ? 'text' : 'password'" placeholder="密码（至少6位）" class="glass-input"
                  v-model="registerForm.password" required minlength="6">
                <button type="button" class="toggle-password" @click="showRegisterPassword = !showRegisterPassword">
                  {{ showRegisterPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <div class="form-group password-group">
                <input :type="showRegisterConfirmPassword ? 'text' : 'password'" placeholder="确认密码" class="glass-input"
                  :class="{ 'input-error': registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword }"
                  v-model="registerForm.confirmPassword" required>
                <button type="button" class="toggle-password"
                  @click="showRegisterConfirmPassword = !showRegisterConfirmPassword">
                  {{ showRegisterConfirmPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <div v-if="registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword"
                class="inline-error">
                ⚠️ 两次输入的密码不一致
              </div>
              <button type="submit" class="glass-button" :disabled="loading">
                {{ loading ? '注册中...' : '注册' }}
              </button>
              <div v-if="registerErrorMessage" class="error-message">
                {{ registerErrorMessage }}
              </div>
            </form>
            <div class="switch-form">
              已有账号？
              <span class="switch-btn" @click="switchToLogin">
                <span class="login-arrow">←</span>
                登录
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Message } from '@arco-design/web-vue'
import { registerUser, sendVerificationCode, resetPassword } from '@/api/user'

// 控制表单切换的变量
// 布局：[忘记密码] [登录] [注册]
// 0% = 显示忘记密码, -33.333% = 显示登录(默认), -66.666% = 显示注册
const translateX = ref(-33.333)

// 登录方式：username 或 email
const loginType = ref<'username' | 'email'>('username')

// 路由实例
const router = useRouter()
// 用户store
const userStore = useUserStore()

// 登录表单数据
const loginForm = reactive({
  username: '',
  email: '',
  password: ''
})

// 注册表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  code: ''
})

// 重置密码表单数据
const resetPasswordForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 状态管理
const loading = ref(false)
const loginErrorMessage = ref('')
const registerErrorMessage = ref('')
const resetPasswordErrorMessage = ref('')

// 密码可见性控制
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showRegisterConfirmPassword = ref(false)
const showResetNewPassword = ref(false)
const showResetConfirmPassword = ref(false)

// 验证码相关状态
const codeSending = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

// 重置密码验证码相关状态
const resetCodeSending = ref(false)
const resetCountdown = ref(0)
let resetCountdownTimer: number | null = null

// 验证码按钮文本
const codeButtonText = computed(() => {
  if (codeSending.value) return '发送中...'
  if (countdown.value > 0) return `${countdown.value}s后重试`
  return '获取验证码'
})

// 重置密码验证码按钮文本
const resetCodeButtonText = computed(() => {
  if (resetCodeSending.value) return '发送中...'
  if (resetCountdown.value > 0) return `${resetCountdown.value}s后重试`
  return '获取验证码'
})

// 重置密码表单验证
const isResetFormValid = computed(() => {
  if (!resetPasswordForm.email || !resetPasswordForm.code ||
    !resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword) {
    return false
  }
  // 检查两次密码是否一致
  return resetPasswordForm.newPassword === resetPasswordForm.confirmPassword
})

// 发送验证码
const sendCode = async () => {
  // 验证邮箱
  if (!registerForm.email) {
    Message.warning('请先输入邮箱地址')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    Message.warning('请输入有效的邮箱地址')
    return
  }

  codeSending.value = true

  try {
    const response = await sendVerificationCode({
      email: registerForm.email,
      type: 'register'
    })

    // 响应拦截器已经处理了 statusCode，能执行到这里说明成功了
    Message.success(response.message || '验证码已发送')
    // 开始倒计时
    countdown.value = 60
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    console.error('发送验证码错误:', error)
    Message.error(error.message || '验证码发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

// 登录处理函数
const handleLogin = async () => {
  // 根据登录类型验证
  if (loginType.value === 'username') {
    if (!loginForm.username || !loginForm.password) {
      loginErrorMessage.value = '请输入用户名和密码'
      return
    }
  } else {
    if (!loginForm.email || !loginForm.password) {
      loginErrorMessage.value = '请输入邮箱和密码'
      return
    }
  }

  try {
    loading.value = true
    loginErrorMessage.value = ''

    // 邮箱登录时，将邮箱值传给 username 字段
    const credentials = {
      username: loginType.value === 'username' ? loginForm.username : loginForm.email,
      password: loginForm.password
    }

    const result = await userStore.login(credentials)

    if (result.success) {
      Message.success('登录成功')
      router.push('/workspace')
    } else {
      loginErrorMessage.value = '登录失败，请检查登录信息'
    }
  } catch (error) {
    console.error('登录错误:', error)
    loginErrorMessage.value = '登录失败,请稍后重试'
  } finally {
    loading.value = false
  }
}

// 注册处理函数
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.confirmPassword || !registerForm.code) {
    registerErrorMessage.value = '请填写完整的注册信息'
    return
  }

  if (registerForm.username.length < 3) {
    registerErrorMessage.value = '用户名至少3个字符'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    registerErrorMessage.value = '请输入有效的邮箱地址'
    return
  }

  if (registerForm.password.length < 6) {
    registerErrorMessage.value = '密码至少6个字符'
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    registerErrorMessage.value = '两次输入的密码不一致'
    return
  }

  if (registerForm.code.length !== 6) {
    registerErrorMessage.value = '请输入6位验证码'
    return
  }

  loading.value = true
  registerErrorMessage.value = ''

  try {
    const response = await registerUser({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      code: registerForm.code
    })

    // 注册成功后直接保存 token 并跳转
    if (response.access_token) {
      Message.success('注册成功，正在跳转...')

      // 保存 token 和用户信息
      userStore.setToken(response.access_token)
      if (response.user) {
        userStore.setUser({
          name: response.user.name || (response.user as any).username,
          email: response.user.email,
          avatar: response.user.avatar || '',
          isLoggedIn: true
        })
      }

      // 保存 refresh_token
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token)
      }

      // 清空表单
      Object.assign(registerForm, {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        code: ''
      })

      // 清除倒计时
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
        countdown.value = 0
      }

      // 直接跳转到工作台
      setTimeout(() => {
        router.push('/workspace')
      }, 500)
    } else {
      registerErrorMessage.value = '注册失败'
    }
  } catch (error: any) {
    console.error('注册错误:', error)
    registerErrorMessage.value = error.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 切换到注册表单
const switchToRegister = () => {
  translateX.value = -66.666 // 向左移动到注册表单（第3个）
  loginErrorMessage.value = ''
}

// 切换到登录表单
const switchToLogin = () => {
  translateX.value = -33.333 // 中间位置是登录表单（第2个）
  registerErrorMessage.value = ''
}

// 切换到忘记密码表单
const switchToForgotPassword = () => {
  translateX.value = 0 // 最左边是忘记密码表单（第1个）
  loginErrorMessage.value = ''
}

// 取消重置，返回登录
const cancelReset = () => {
  translateX.value = -33.333 // 返回登录表单（第2个）
  resetPasswordErrorMessage.value = ''
  // 清空重置密码表单
  Object.assign(resetPasswordForm, {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  // 清除倒计时
  if (resetCountdownTimer) {
    clearInterval(resetCountdownTimer)
    resetCountdownTimer = null
    resetCountdown.value = 0
  }
}

// 发送重置密码验证码
const sendResetCode = async () => {
  // 验证邮箱
  if (!resetPasswordForm.email) {
    Message.warning('请先输入邮箱地址')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resetPasswordForm.email)) {
    Message.warning('请输入有效的邮箱地址')
    return
  }

  resetCodeSending.value = true

  try {
    const response = await sendVerificationCode({
      email: resetPasswordForm.email,
      type: 'reset_password'
    })

    // 响应拦截器已经处理了 statusCode，能执行到这里说明成功了
    Message.success(response.message || '验证码已发送')
    // 开始倒计时
    resetCountdown.value = 60
    resetCountdownTimer = window.setInterval(() => {
      resetCountdown.value--
      if (resetCountdown.value <= 0 && resetCountdownTimer) {
        clearInterval(resetCountdownTimer)
        resetCountdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    console.error('发送验证码错误:', error)
    Message.error(error.message || '验证码发送失败，请稍后重试')
  } finally {
    resetCodeSending.value = false
  }
}

// 处理重置密码
const handleResetPassword = async () => {
  // 表单验证
  if (!resetPasswordForm.email || !resetPasswordForm.code ||
    !resetPasswordForm.newPassword || !resetPasswordForm.confirmPassword) {
    resetPasswordErrorMessage.value = '请填写完整的信息'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(resetPasswordForm.email)) {
    resetPasswordErrorMessage.value = '请输入有效的邮箱地址'
    return
  }

  if (resetPasswordForm.code.length !== 6) {
    resetPasswordErrorMessage.value = '请输入6位验证码'
    return
  }

  if (resetPasswordForm.newPassword.length < 6) {
    resetPasswordErrorMessage.value = '密码至少6个字符'
    return
  }

  if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
    resetPasswordErrorMessage.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  resetPasswordErrorMessage.value = ''

  try {
    const response = await resetPassword({
      email: resetPasswordForm.email,
      code: resetPasswordForm.code,
      newPassword: resetPasswordForm.newPassword
    })

    // 响应拦截器已经处理了 statusCode，能执行到这里说明成功了
    Message.success({
      content: '密码重置成功！1秒后自动跳转到登录页面',
      duration: 3000
    })

    // 清空表单
    Object.assign(resetPasswordForm, {
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 清除倒计时
    if (resetCountdownTimer) {
      clearInterval(resetCountdownTimer)
      resetCountdownTimer = null
      resetCountdown.value = 0
    }

    // 延迟返回登录页面
    setTimeout(() => {
      translateX.value = -33.333 // 返回登录表单（第2个）
    }, 1000)
  } catch (error: any) {
    console.error('重置密码错误:', error)
    resetPasswordErrorMessage.value = error.message || '密码重置失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(loginType, () => {
  // 清空登录表单
  loginForm.username = ''
  loginForm.email = ''
  loginForm.password = ''
  // 清空错误信息
  loginErrorMessage.value = ''
})

// 3D倾斜效果 - 登录卡片
// const loginCard = ref<HTMLElement | null>(null)

// const handleMouseMove = (e: MouseEvent) => {
// if (!loginCard.value) return

// const rect = loginCard.value.getBoundingClientRect()
// const x = e.clientX - rect.left
// const y = e.clientY - rect.top
// const centerX = rect.width / 2
// const centerY = rect.height / 2
// const maxTilt = 15
// const rotateY = ((x - centerX) / centerX) * maxTilt
// const rotateX = -((y - centerY) / centerY) * maxTilt
// loginCard.value.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
// }

// const handleMouseLeave = () => {
//   if (!loginCard.value) return
//   loginCard.value.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)'
// }

// 3D倾斜效果 - 注册卡片
// const registerCard = ref<HTMLElement | null>(null)

// const handleMouseMoveRegister = (e: MouseEvent) => {
//   if (!registerCard.value) return

//   const rect = registerCard.value.getBoundingClientRect()
//   const x = e.clientX - rect.left
//   const y = e.clientY - rect.top
//   const centerX = rect.width / 2
//   const centerY = rect.height / 2
//   const maxTilt = 15
//   const rotateY = ((x - centerX) / centerX) * maxTilt
//   const rotateX = -((y - centerY) / centerY) * maxTilt
//   registerCard.value.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
// }

// const handleMouseLeaveRegister = () => {
//   if (!registerCard.value) return
//   registerCard.value.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)'
// }
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.animated-background {
  width: 100%;
  height: 100%;
  background-image: url('../../assets/macwallpaper.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// 表单包裹器 - 类似 2.html 的 container
.form-wrapper {
  width: 100%;
  max-width: 400px;
  background: transparent;
  border-radius: 24px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
}

// 表单容器 - 类似 2.html 的 form-container
.form-container {
  display: flex;
  width: 300%; // 三个表单：忘记密码、登录、注册
  transition: transform 0.5s ease-in-out;
}

// 登录、注册和忘记密码卡片共同样式
.login-card,
.register-card,
.forgot-password-card {
  width: 33.333%; // 每个占三分之一
  flex-shrink: 0;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: transparent;
}

// 毛玻璃效果
.glass-effect {
  position: absolute;
  inset: 0;
  z-index: 0;
  // backdrop-filter: blur(5px);
  filter: url(#glass-distortion);
  isolation: isolate;
  border-radius: 24px;
}

.glass-tint {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 24px;
}

.glass-shine {
  position: absolute;
  inset: 0;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 24px;
  box-shadow:
    inset 1px 1px 8px 0 rgba(255, 255, 255, 0.18),
    inset -1px -1px 8px 0 rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.glass-content {
  position: relative;
  z-index: 3;
  padding: 40px 30px;
  color: white;
}

.login-title {
  text-align: center;
  color: #fff;
  margin-bottom: 30px;
  font-size: 2rem;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
}

.login-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
  border-radius: 2px;
}

.form-group {
  margin-bottom: 20px;
}

// 邮箱提示样式
.email-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.15); // 蓝色半透明背景
  border-left: 3px solid rgba(59, 130, 246, 0.6);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  line-height: 1.5;
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 密码输入框组合（带显示/隐藏按钮）
.password-group {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  .glass-input {
    flex: 1;
    padding-right: 45px; // 为按钮留出空间
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    cursor: pointer;
    padding: 8px;
    line-height: 1;
    transition: all 0.3s ease;
    z-index: 10;

    &:hover {
      color: rgba(255, 255, 255, 1);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// 验证码组合输入框
.verification-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.verification-input {
  flex: 1;
}

.code-button {
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  white-space: nowrap;
  min-width: 100px;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 登录方式切换标签
.login-type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 10px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &.active {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: rgba(255, 255, 255, 0.9);
  }
}

.glass-input {
  width: 100%;
  height: 45px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }

  // 错误状态样式 - 使用青色系与橙红背景形成对比
  &.input-error {
    border-color: rgba(34, 211, 238, 0.7);
    background: rgba(34, 211, 238, 0.1);

    &:focus {
      border-color: rgba(34, 211, 238, 0.9);
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
    }
  }
}

// 实时错误提示（显示在输入框下方）- 使用青色系
.inline-error {
  color: #60a5fa;
  font-size: 0.8rem;
  margin-top: -12px;
  margin-bottom: 12px;
  padding: 6px 12px;
  background: rgba(34, 211, 238, 0.15);
  border-left: 3px solid #60a5fa;
  border-radius: 4px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glass-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 按钮组样式（用于取消和确定按钮）
.button-group {
  display: flex;
  gap: 12px;

  .glass-button {
    flex: 1;
  }

  .cancel-button {
    background: rgba(255, 255, 255, 0.1);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// 忘记密码链接
.forgot-password-link {
  text-align: center;
  margin-top: 12px;
  margin-bottom: 12px;
}

.link-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: underline;

  &:hover {
    color: #fff;
  }
}

.error-message {
  margin-top: 1rem;
  padding: 8px 12px;
  background: rgba(34, 211, 238, 0.2);
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 8px;
  color: #60a5fa;
  font-size: 0.875rem;
  text-align: center;
  backdrop-filter: blur(5px);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

// 切换表单区域样式
.switch-form {
  text-align: center;
  margin-top: 25px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.switch-btn {
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(2px);
  }
}

.register-arrow,
.login-arrow {
  margin: 0 5px;
  transition: all 0.3s;
}

.switch-btn:hover .register-arrow {
  transform: translateX(3px);
}

.switch-btn:hover .login-arrow {
  transform: translateX(-3px);
}

// 3D 鼠标跟随效果
.glass-component {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

@media (max-width: 480px) {
  .glass-content {
    padding: 30px 20px;
  }
}

.specialButton {
  background-color: rgba(0, 0, 0, 0) !important;
}
</style>