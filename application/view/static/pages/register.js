// Register page: Does user side validation for each field, shows errors correspondingly;
// Errors flash using the MagicFade function.
// Server side validation is also done, and any errors caught on that end are sent back, and they are also flashed.
// If the user left the form part way, session storage is used to keep the values in the form.

function MagicFade(opacityObj) {
    opacityObj.opacity = Math.min(Math.max(opacityObj.opacity, 0), 1); // Clamp between 0 and 1
    let duration = 10; // Adjust duration if needed (in milliseconds)
    const fade = (step) => {
        opacityObj.opacity = Math.min(Math.max(opacityObj.opacity + step, 0), 1); // Clamp between 0 and 1

        if (opacityObj.opacity === 0) {
            setTimeout(() => fade(0.1), duration);
        } else if (opacityObj.opacity !== 1) {
            setTimeout(() => fade(step), duration);
        }

    };

    if (opacityObj.opacity > 0) {
        fade(-0.1);
    } else {
        fade(0.1)
    }
}

const app = Vue.createApp({
    template: `
<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-6 col-sm-8">
            <h1 class="text-center mb-5">Register</h1>

            <div class="card shadow rounded">
                <div class="card-body">
                    
                    <p v-bind:style="{'opacity' : genErrorOpacity.opacity}" class="text-center text-danger">{{gen_error}}</p>
                    
                    <form id="reg-form" @submit.prevent="handleSubmit">

                        <div class="form-group mb-3">
                            <label htmlFor="username" class="form-label">Username</label>
                            <input v-model="username" type="text" id="username" placeholder="Username"
                                   class="form-control" required aria-required="true"/>
                            <p id="uname_error" v-bind:style="{'opacity' : unameErrorOpacity.opacity, 'white-space':'pre'}" class="text-danger">{{uname_error}}</p>
                        </div>

                        <div class="form-group mb-3">
                            <label htmlFor="email" class="form-label">Email address</label>
                            <input v-model="email" type="email" id="email" placeholder="Email address"
                                   class="form-control" required aria-required="true"/>
                        </div>

                        <div class="form-group mb-3">
                            <label htmlFor="password" class="form-label">Password</label>
                            <input v-model="password" type="password" id="password" placeholder="Password"
                                   class="form-control" required aria-required="true"/>
                            <p id="pwd_error" class="text-danger" v-bind:style="{'opacity' : pwdErrorOpacity.opacity, 'white-space':'pre'}">{{passwordError}}</p>
                        </div>

                        <div class="form-group mb-3">
                            <label htmlFor="confirm_password" class="form-label">Confirm password</label>
                            <input v-model="confirmPassword" type="password" id="confirm_password"
                                   placeholder="Confirm password" class="form-control" required aria-required="true"/>
                            <p id="pwd_error_2" v-bind:style="{'opacity' : pwdError2Opacity.opacity, 'white-space':'pre'}" class="text-danger">{{passwordError2}}</p>
                        </div>

                        <button type="submit" class="btn btn-primary">Register</button>
                    </form>
                </div>
            </div>

            <div class="card text-center mt-5 shadow rounded">
                <div class="card-body">
                    Ensure that the following Criteria are met by your password:
                     
                    <ul>
                        <li>Must be between 12 and 25 characters long.</li>
                        <li>Has atleast one Uppercase letter. (A-Z)</li>
                        <li>Has atleast one Lowercase letter. (a-z)</li>
                        <li>Has atleast one number. (0-9)</li>
                        <li>Has atleast one special character. (!@#$%^&*)</li>
                        <li>Does not contain spaces.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
`,
    data() {
        return {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",

            passwordError: "",
            pwdErrorOpacity: {opacity: 0},

            passwordError2: "",
            pwdError2Opacity: {opacity: 0},

            uname_error: "",
            unameErrorOpacity: {opacity: 0},

            gen_error: "",
            genErrorOpacity: {opacity: 0}
        };
        // Note that gen error is at the top of the Reg box, and the others are each for one box
    },
    methods: {
        validateEmail(email) {
            return String(email)
                .toLowerCase()
                .match(
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                );
        },

        validatePassword(password) {
            var length = password.length;
            var errors = [];

            if (length < 12 || length > 25) {
                errors.push("The password must be between 12 and 25 characters long.");
            }
            if (!/[A-Z]/.test(password)) {
                errors.push("The entered password does not have an Uppercase letter.");
            }
            if (!/[a-z]/.test(password)) {
                errors.push("The entered password does not have a Lowercase letter.");
            }
            if (!/\d/.test(password)) {
                errors.push("The entered password does not have a number.");
            }
            if (!/[!@#$%^&*]/.test(password)) {
                errors.push("The entered password does not have a special character.");
            }
            if (password.includes(' ')) {
                errors.push("Spaces are not allowed in the password.");
            }
            return errors
        },

        handleSubmit() {
            const errors = this.validatePassword(this.password)

            this.passwordError = "";
            this.passwordError2 = "";
            this.uname_error = "";
            this.gen_error = "";
            if (this.validateEmail(this.username)){
                this.uname_error = "Username cannot be of the form of an email.";
                MagicFade(this.unameErrorOpacity);
                return;
            }
            if (errors.length > 0) {
                errors.forEach(error => {
                    this.passwordError += error + "\n";
                })
                MagicFade(this.pwdErrorOpacity)
                return;
            }

            if (this.password !== this.confirmPassword) {
                this.passwordError2 = "Passwords do not match.";
                MagicFade(this.pwdError2Opacity)
                return;
            }

            const formData = new FormData();
            formData.append("username", this.username);
            formData.append("email", this.email);
            formData.append("password", this.password);

            fetch("/register_user", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP Error')
                    }
                    return response.json()
                })
                .then(data => {
                    if (data.error) {
                        if(data.error==="uname_taken") {
                            this.uname_error = "Username already taken.";
                            MagicFade(this.unameErrorOpacity);
                        }
                        else if(data.error==="email_taken") {
                            this.gen_error = "This email is already registered with an account.";
                            MagicFade(this.genErrorOpacity);
                        }
                        else if(data.error==="uname_mail"){
                            this.uname_error = "Username cannot be an email.";
                            MagicFade(this.unameErrorOpacity);
                        }
                        else if(data.error==="invalid_email") {
                            this.gen_error = "Invalid email.";
                            MagicFade(this.genErrorOpacity);
                        }
                    } else {
                        sessionStorage.email = "";
                        sessionStorage.username = "";
                        window.location.replace("/login?registered=true");
                    }
                })
                .catch(() => {
                    this.gen_error = "We are experiencing technical difficulties. Please try again later.";
                    MagicFade(this.genErrorOpacity);
                });
        }
    },
    mounted() {
        if(sessionStorage.username){
            this.username = sessionStorage.username;
        }
        if(sessionStorage.email){
            this.email = sessionStorage.email;
        }
    },
    watch: {
        username(newVal) {
            sessionStorage.username = newVal;
        },
        email(newVal) {
            sessionStorage.email = newVal;
        }
    }
});

app.mount('#app');
