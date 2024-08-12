export const allbooks = Vue.component('allbooks', {
    data() {
        return {
            sections: []
        }
    },
    template: `
    <div style="width:80vw; margin-left: auto; margin-right: auto;">
    <div v-for="(sec, index) in this.sections">
        <hr>
        <sect :section="sec"></sect>
    </div>
    </div>
    `,
    beforeCreate() {
        fetch("/api/everything").then(response => response.json()).then(data => {
            this.sections = data
        })
    }
})

const sect = Vue.component("sect", {
    props: {
        section: Object
    },
    template: `
    <div class="container-fluid">
        <h2>{{section.section_name}}</h2>        
        <div class="row flex-nowrap col-12 overflow-auto py-2 px-3 my-3 mx-0">
              <book v-for="(bk, index) in section.books" v-bind:key="bk.book_id" :book="bk"></book>
        </div>
    </div>
    `
})

const book = Vue.component("book", {
    props: {
        book: Object
    },
    template: `
    <div class="card col-md-1.5 m-2 p-0 flex-col flex align-items-center justify-contents-center" style="min-width: 250px">
        <img  :src="book.book_image"  class="card-img-top" alt="book image" style="width:150px;height:200px">
        <div class="card-body">
            <h6 class="card-title">{{ book.book_name}}</h6>
            <p class="card-text" style="margin-bottom: 0">{{ book.book_author}}</p>
            <p> ₹ {{book.book_price}} </p>
            
            <div v-if="!book.book_owned">
                <a v-on:click="makePurchase()" class="btn btn-danger">Buy</a>   
                <a v-if="book.request_status=='Pending'" class="btn btn-secondary">Requested</a>
                <a v-else-if="book.request_status=='Approved'" :href="'/readbook/'+book.book_id" target="_blank" class="btn btn-warning">Read</a>
                <a v-else v-on:click="sendRequest()" class="btn btn-primary">Request</a>
            </div>
            
            <div v-else>
                <a class="btn btn-success" href="/static/pdfs/dummy.pdf"  download>Download</a>
                <a class="btn btn-warning" :href="'/readbook/'+book.book_id" target="_blank" >Read</a>
            </div>
        </div>
    </div>
    `,
    methods: {
        sendRequest() {
            fetch("/api/bookrequest/" + this.book.book_id, {
                method: "POST",
                body: {}
            }).then(response => {
                if (response.status === 201) {
                    this.book.request_status = "Pending"
                } else if (response.status === 403) {
                    alert('You have reached the maximum number of simultaneous requests.')
                } else if (response.status === 401) {
                    alert('You need to login to request a book.')
                    window.location.replace('/login');
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        },
        makePurchase(){

            fetch("/isloggedin", {
                method: "POST",
                body: {}
            }).then(response => {
                if (response.status === 200) {
                    window.location.replace('/#/purchase/'+this.book.book_id)
                } else if (response.status === 401) {
                    alert('You need to login to purchase a book.')
                    window.location.replace('/login');
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
}})
