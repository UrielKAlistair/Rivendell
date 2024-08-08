export const purchase = Vue.component("purchase", {
    data() {
        return {
            cost: 0
        }
    },
    props: {
        id: String
    },
    created(){
        fetch("/isloggedin", {
                method: "POST",
                body: {}
            }).then(response => {
                if (response.status === 401) {
                    alert('You need to login to purchase a book.')
                    window.location.replace('/login');
                } else if (response.status !== 200){
                    alert('We are facing some technical issues. Please try again later.')
                }});

        fetch('/api/book/'+this.id).then(response => response.json()).then(data => {
            this.cost = data.book_price
        });
    },
    template: `<div class="d-flex flex-column justify-content-center align-items-center">
<h2>Are you Sure?</h2>
<img src="static/images/purchase.jpeg" alt="site name" class="img-fluid" style="max-height: 65vh">
<h2>You're going to pretend to pay ₹{{this.cost}}!</h2>
<h3>This will permanently grant you ownership of this book and allow you to download it as a pdf.</h3>
<div class="d-flex">
<a v-on:click="buy" class="btn btn-primary m-2">Yes, I understand</a>
<RouterLink :to="'/'" class="btn btn-danger m-2">No way! Take me back!</RouterLink>
</div>
</div>
`,
    methods: {
        buy() {
            fetch("/api/purchase/" + this.id, {
                method: "POST",
                body: {}
            }).then(response => {
                console.log(response.status)
                if (response.status === 201) {
                    alert('You have successfully purchased the book.')
                    this.$router.push('/mybooks')
                } else if (response.status === 409) {
                    alert('You have already bought this book.')
                } else if (response.status === 401) {
                    alert('You need to login to purchase a book.')
                    window.location.replace('/login');
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

