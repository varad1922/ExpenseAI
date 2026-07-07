document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const alertBox = document.getElementById('alertBox');
  const toggleForgot = document.getElementById('toggleForgot');
  const backToLogin = document.getElementById('backToLogin');
  const authFooter = document.getElementById('authFooter');

  const showAlert = (message, type = 'error') => {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 6000);
  };

  // Toggle Forgot Password View
  if (toggleForgot && forgotForm && loginForm && authFooter) {
    toggleForgot.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      authFooter.style.display = 'none';
      forgotForm.style.display = 'block';
    });
  }

  if (backToLogin && forgotForm && loginForm && authFooter) {
    backToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      forgotForm.style.display = 'none';
      loginForm.style.display = 'block';
      authFooter.style.display = 'block';
    });
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const data = await API.post('/auth/login', { email, password });
        if (data.success) {
          API.setToken(data.token);
          API.setUser(data.user);
          showAlert('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (err) {
        showAlert(err.message || 'Login failed. Please check credentials.');
      }
    });
  }

  // Handle Registration submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        const data = await API.post('/auth/register', { name, email, password });
        if (data.success) {
          API.setToken(data.token);
          API.setUser(data.user);
          showAlert('Registration successful! Launching dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (err) {
        showAlert(err.message || 'Registration failed. Try again.');
      }
    });
  }

  // Handle Forgot Password submission
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      const newPassword = document.getElementById('forgotNewPassword').value;

      try {
        const data = await API.post('/auth/forgot-password', { email, newPassword });
        if (data.success) {
          showAlert(data.message, 'success');
          setTimeout(() => {
            // Automatically log in with new password
            loginForm.style.display = 'block';
            authFooter.style.display = 'block';
            forgotForm.style.display = 'none';
            document.getElementById('email').value = email;
            document.getElementById('password').value = newPassword;
          }, 2000);
        }
      } catch (err) {
        showAlert(err.message || 'Password reset request failed.');
      }
    });
  }
});
