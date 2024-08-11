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
export const settings = Vue.component('settings', {
    data() {
        return {
            username: "",
            email: "",
            old_password: "",
            new_password: "",
            confirmPassword: "",

            passwordError: "",
            pwdErrorOpacity: {opacity: 0},

            passwordError2: "",
            pwdError2Opacity: {opacity: 0},

            uname_error: "",
            unameErrorOpacity: {opacity: 0},

            gen_error: "",
            genErrorOpacity: {opacity: 0},

            success_message: "",
            successOpacity: {opacity: 0},

            oldPasswordError: "",
            oldPwdErrorOpacity: {opacity: 0}
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
            const errors = this.validatePassword(this.new_password)

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

            if (this.new_password !== this.confirmPassword) {
                this.passwordError2 = "Passwords do not match.";
                MagicFade(this.pwdError2Opacity)
                return;
            }

            const formData = new FormData();
            formData.append("username", this.username);
            formData.append("email", this.email);
            formData.append("old_password", this.old_password);
            formData.append("new_password", this.new_password);

            fetch("/updateprofile", {
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
                            this.gen_error = "This email is already registered with another account.";
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
                        else if(data.error==='incorrect_password'){
                            this.oldPasswordError = "Incorrect password.";
                            MagicFade(this.oldPwdErrorOpacity);
                        }
                    } else {
                        sessionStorage.email = "";
                        sessionStorage.username = "";
                        this.success_message = "Profile updated successfully"
                        MagicFade(this.successOpacity)
                    }
                })
                .catch(() => {
                    this.gen_error = "We are experiencing technical difficulties. Please try again later.";
                    MagicFade(this.genErrorOpacity);
                });
        }
    },
    mounted() {
        fetch("/settings", {
            method:"POST",
            body:{}}).then(response => {
            if (!response.ok) {
                throw new Error('HTTP Error')
            }
            return response.json()
        }).then(data => {
            this.username = data.username;
            this.email = data.email
        })
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
    },

    template: `
<div class = "container-fluid">
    <div class="row">
        <div class="col-md-2">
            <div style="border-left: 1px solid rgba(0,0,0,0.1); height: 100vh; position: absolute; left: 100%; top: 0;"></div>
        </div>
        <div class="col-md-6">
        
            <div class="card shadow rounded">
                <div class="card-body">
                    
                    <p v-bind:style="{'opacity' : genErrorOpacity.opacity}" class="text-center text-danger">{{gen_error}}</p>
                    <p v-bind:style="{'opacity' : successOpacity.opacity}" class="text-center text-success">{{success_message}}</p>
                    
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
                            <label htmlFor="old_password" class="form-label">Current Password</label>
                            <input v-model="old_password" type="password" id="password" placeholder="New Password"
                                   class="form-control" required aria-required="true"/>
                            <p id="pwd_error" class="text-danger" v-bind:style="{'opacity' : oldPwdErrorOpacity.opacity, 'white-space':'pre'}">{{oldPasswordError}}</p>
                        </div>
                        
                        <div class="form-group mb-3">
                            <label htmlFor="new_password" class="form-label">New Password</label>
                            <input v-model="new_password" type="password" id="password" placeholder="New Password"
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
`
})