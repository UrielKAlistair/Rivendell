const dateformatter = function (value) {
    if (value === null) {
        return null
    }
    return new Date(value).toLocaleString()
};

export const mybooks = Vue.component("mybooks", {
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
                sortOrder: 'asc'
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
