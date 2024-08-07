// Simple login page with a user side validation, error flashing with a fade function, and a fetch server call to validate.
function MagicFade(opacityObj) {
    opacityObj.opacity = Math.min(Math.max(opacityObj.opacity, 0), 1); // Clamp between 0 and 1
    let duration = 10; // Adjust duration if needed (in milliseconds)
    const fade = (step) => {
        opacityObj.opacity = Math.min(Math.max(opacityObj.opacity + step, 0), 1); // Clamp between 0 and 1

        if (opacityObj.opacity === 0) {
            setTimeout(()=>fade(0.1), duration);
        }
        else if (opacityObj.opacity !== 1) {
            setTimeout(()=>fade(step), duration);
        }

    };

    if (opacityObj.opacity > 0) {
        fade(-0.1);
    }
    else{
        fade(0.1)
    }
}

const app = Vue.createApp({
    template: `
  <div class="container">
    
    <div class="row flex align-items-center justify-contents-center vh-100">
      
      <div class="col-md-5 col-sm-4 image-container d-flex flex-column align-items-center">
        <img alt="rivendell name banner" src="static/images/title.png" class="img-fluid">
        <img alt="rivendell logo" src="static/images/loginArt.png" class="img-fluid">
      </div>
      
      <div class="col-md-7 col-sm-8">
        <h1 class="text-center my-4">Login</h1>
        <login-form></login-form>
      </div>
      
    </div>
    
  </div>
  `
});

app.component('LoginForm', {
    data() {
        return {
            errorMessage: "",
            errorOpacity: {opacity: 0},
            username: "",
            password: "",
            errorDanger: true
        };
    },
    methods: {
        handleSubmit() {
            // Redirect to home if successful
            // Update error div otherwise.
            const formData = new FormData();
            formData.append("username", this.username);
            formData.append("password", this.password);

            fetch("/validate_login", {
                method: "POST",
                body: formData
            })
                .then(response =>{
                    if (!response.ok) {
                        throw new Error('HTTP Error')
                    }
                    return response.json()
                })
                .then(data => {
                    if (data.error) {
                        this.errorMessage = data.error;
                        this.errorDanger = true;
                        MagicFade(this.errorOpacity);
                    } else {
                        window.location.replace("/");
                    }
                })
                .catch(() => {
                    this.errorMessage = "We are experiencing technical difficulties. Please try again later.";
                    this.errorDanger = true;
                    MagicFade(this.errorOpacity);
                });
        }
    },
    template: `
  <div class="card mb-3">
    <div class="card-body">
      <p v-bind:style="{'opacity' : errorOpacity.opacity}" v-bind:class="['text-center', errorDanger? 'text-danger':'text-success']">{{ errorMessage }}</p>
      
      <form @submit.prevent="handleSubmit" class="mx-3">        
        <div class="mb-3">
          <label for="username" class="form-label">Username/Email</label>
          <input type="text" id="username" v-model="username" placeholder="Username/Email" class="form-control" required aria-required="true"/>
        </div>
        <div class="mb-3 d-flex justify-content-between">
          <label for="password" class="form-label">Password</label>
          <a href="/reset" class="text-primary">Forgot Password?</a>
        </div>
        <input type="password" id="password" v-model="password" placeholder="Password" class="form-control" required aria-required="true" />
        <button type="submit" class="btn btn-primary mt-3">Login</button>
      </form>
      <p class="text-center mt-3">
        Don't have an account? <a href="/register" class="text-primary">Register Here.</a>
      </p>
    </div>
  </div>
  `,
    mounted(){
        if(window.location.href.split('?')[1]==='registered=true'){
            this.errorMessage = "Registration successful. Please login to continue.";
            this.errorDanger = false;
            MagicFade(this.errorOpacity);
        };
    }
});

app.mount('#app');
