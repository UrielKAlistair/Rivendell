import {navbar} from "../components/navbar.js";

const homenavbar = Vue.component('navbar', {
    ...navbar, beforeMount() {
        if (this.isloggedin) {
            this.navigationLinks = [
                {text: "Home", href: "/"},
                {text: "My Books", href: "/mybooks"},
                {text: "Stats", href: "/mystats"},
            ];
        } else {
            this.navigationLinks = [
                {text: "Home", href: "/"}
            ];
        }
    }
})

const allbooks = Vue.component('allbooks', {
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
        fetch("/api/sections").then(response => response.json()).then(data => {
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
                <RouterLink :to="'purchase/'+book.book_id+'/'+book.book_price" class="btn btn-danger">Buy</RouterLink>   
                <a v-if="book.request_status=='Pending'" class="btn btn-secondary">Requested</a>
                <a v-else-if="book.request_status=='Approved'"  class="btn btn-warning">Read</a>
                <a v-else v-on:click="sendRequest()" class="btn btn-primary">Request</a>
            </div>
            
            <div v-else>
                <a class="btn btn-success">Download</a>
                <a class="btn btn-warning">Read</a>
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
                console.log(response.status)
                if (response.status === 201) {
                    this.book.request_status = "Pending"
                } else if (response.status === 403) {
                    alert('You have reached the maximum number of requested books.')
                } else if (response.status === 401) {
                    alert('You need to login to request a book.')
                    window.location.replace('/login');
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const dateformatter = function (value) {
    if (value === null) {
        return null
    }
    return new Date(value).toLocaleString()
};

const mybooks = Vue.component("mybooks", {
    components: {
        'BootstrapTable': BootstrapTable
    },
    data() {
        return {
            reqbooks: [],
            ownedbooks: [],
            pastreqs: [],
            reqtablecolumns: [{field: 'book_name', title: 'Book Name', sortable: true},
                {field: 'date_of_request', title: 'Request Date', sortable: true, formatter: dateformatter},
                {field: 'date_of_issue', title: 'Issue Date', sortable: true, formatter: dateformatter},
                {field: 'due_date', title: 'Return Date', sortable: true, formatter: dateformatter},
                {field: 'request_status', title: 'Status', sortable: true}],

            reqtableoptions: {
                search: true,
                showColumns: true,
                sortable: true,
                sortName: 'date_of_request',
                sortOrder: 'desc'
            }
        }
    },
    template: `
<div style="width:80vw; margin-left: auto; margin-right: auto;">
    <h2>Currently Active Requests:</h2>
    <div class="col-12 py-2 px-3 my-3 mx-0">
      <div v-if="reqbooks.length > 0">
          <div class="flex-nowrap row overflow-auto">
                <reqbook v-for="(bk, index) in reqbooks" :key="bk.book_id" :book="bk"></reqbook>
          </div>      
      </div>
      <p style="color:gray" v-else>No active requests</p>
    </div>
    <hr>
    <h2>Owned Books:</h2>
    <div class="col-12 py-2 px-3 my-3 mx-0">
      <div v-if="ownedbooks.length > 0">
          <div class="flex-nowrap row overflow-auto">
                <ownedbook v-for="(bk, index) in ownedbooks" :key="bk.book_id" :book="bk"></ownedbook>
          </div>
      </div>
      <p style="color:gray" v-else>No owned Books</p>
    </div>
    <hr>
    <h2>Request History:</h2>

    <div class="row col-12 overflow-x-auto py-2 px-3 my-3 mx-0" style="background: #ffffff;">
      <div v-if="pastreqs.length > 0" class="table-responsive">
      <bootstrap-table :columns="reqtablecolumns" :data="pastreqs" :options="reqtableoptions" class="table table-striped" data-thead-classes="thead-dark"></bootstrap-table>
      </div>
      <p style="color:gray" v-else>No Past Requests</p>
    </div>
    </div>
    `,
    beforeCreate() {
        fetch("/api/myreqbooks").then(response => response.json()).then(data => {
            this.reqbooks = data
        })
        fetch("/api/myownedbooks").then(response => response.json()).then(data => {
            this.ownedbooks = data
        })
        fetch("/api/mypastreqs").then(response => response.json()).then(data => {
            this.pastreqs = data
        })
    }
})

const reqbook = Vue.component("reqbook", {
    props: {
        book: Object
    },
    data() {
        return {
            visible: true
        }
    }
    ,
    template: `
    <div v-if="visible" class="card col-md-1.5 m-2 p-0 flex-col flex align-items-center justify-contents-center">
        <img :src="book.book_image" class="card-img-top" alt="book image" style="width:150px;height:200px">
        <div class="card-body">
            <h6 class="card-title" >{{ book.book_name}}</h6>
            <p class="card-text" style="margin-bottom: 0">{{ book.book_author}}</p>
            <p> ₹ {{book.book_price}} </p>
            <div class="flex flex-column d-flex justify-content-around">
                <RouterLink :to="'purchase/'+book.book_id+'/'+book.book_price" class="btn btn-danger">Buy</RouterLink>  
                <a v-on:click="cancelRequest()" v-if="book.request_status=='Pending'" class="btn btn-primary m-2"> Cancel Request</a>
                <div v-else class="flex flex-column d-flex justify-content-around">
                    <a class="btn btn-warning m-2">Read</a>
                    <a v-on:click="returnBook()" class="btn btn-success m-2">Return</a>
                </div>
            </div>
        </div>
    </div>
    `,
    methods: {
        cancelRequest() {
            if (!confirm("Are you sure ?")) {
                return
            }

            fetch("/api/cancelrequest/" + this.book.req_id, {
                method: "POST",
                body: {}
            }).then(response => {
                console.log(response.status)
                if (response.status === 204) {
                    this.visible = false
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        },
        returnBook() {

            if (!confirm("Are you sure ?")) {
                return
            }

            fetch("/api/returnbook/" + this.book.req_id, {
                method: "POST",
                body: {}
            }).then(response => {
                console.log(response.status)
                if (response.status === 204) {
                    this.visible = false
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const ownedbook = Vue.component("ownedbook", {
    props: {
        book: Object
    },
    template: `
    <div class="card col-md-1.5 m-2 p-0 flex-col flex align-items-center justify-contents-center" style="min-width: 250px">
        <img  :src="book.book_image"  class="card-img-top" alt="book image" style="width:150px;height:200px">
        <div class="card-body">
            <h6 class="card-title">{{ book.book_name}}</h6>
            <p class="card-text" style="margin-bottom: 0">{{ book.book_author}}</p>     
                <a class="btn btn-success">Download</a>
                <a class="btn btn-warning">Read</a>
        </div>
    </div>`

})
const purchase = Vue.component("purchase", {
    props: {
        cost: String,
        id: String
    },
    template: `<div class="d-flex flex-column justify-content-center align-items-center">
<h2>Are you Sure?</h2>
<img src="static/images/purchase.jpeg" alt="site name" class="img-fluid" style="max-height: 65vh">
<h2>You're going to pretend to pay ₹{{cost}}!</h2>
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
const mystats = {}


const routes = [{
    path: '/',
    component: allbooks
}, {
    path: '/mybooks',
    component: mybooks
},
    {
        path: '/mystats',
        component: mystats
    },
    {
        path: '/purchase/:id/:cost',
        component: purchase,
        props: true
    }]

const router = new VueRouter({routes})

const app = new Vue({
    el: '#app',
    router: router,
    delimiters: ['${', '}']
})


