import {navbar} from "../components/navbar.js";
import {stats} from "./admin_stats.js";

const homenavbar = Vue.component('navbar', {
    ...navbar, beforeMount() {
        this.navigationLinks = [
            {text: "Home", href: "/"},
            {text: "Requests", href: "/requests"},
            {text: "Stats", href: "/stats"},
        ];
    }
})

const book = Vue.component("book", {
    props: {
        book: Object,
        section_name: String
    },
    data() {
        return {
            visible: true,
            showeditmodal: false
        }
    },
    template: `
    <div v-if="visible" class="card col-md-1.5 m-2 p-0 flex-col flex align-items-center justify-contents-center" style="min-width: 250px">
        <img :src="book.book_image" class="card-img-top" alt="book image" style="width:150px;height:200px">
        <div class="card-body">
            <h6 class="card-title">{{ book.book_name}}</h6>
            <p class="card-text" style="margin-bottom: 0">{{book.book_author}}</p>
            <p> ₹ {{book.book_price}} </p>
            <div class="d-flex flex-column justify-content-around">
                <a v-on:click="showeditmodal=true" class="btn btn-success m-1">Edit</a>
                <transition name="modal">
                    <editmodal :book="book" :section_name_default="section_name" v-if="showeditmodal" v-on:close="showeditmodal=false"></editmodal>
                </transition>
                <a :href="'/readbook/'+book.book_id" target="_blank" class="btn btn-primary m-1">Read</a>
                <a v-on:click="deletebook(book)" class="btn btn-danger m-1">Delete</a>
            </div>
        </div>
    </div>
    `,
    beforeMount() {
        book.showeditmodal = false
    }
    ,
    methods: {
        deletebook(book) {
            if (!confirm("Are you sure ?")) {
                return
            }

            fetch("/api/book/" + this.book.book_id, {
                method: "DELETE",
                body: {}
            }).then(response => {
                console.log(response.status)
                if (response.status === 200) {
                    this.visible = false
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const editmodal = Vue.component("editmodal", {
    props: {
        book: Object,
        section_name_default: String
    },
    data() {
        return {
            book_name: this.book.book_name,
            book_author: this.book.book_author,
            book_price: this.book.book_price,
            section_name: this.section_name_default
        }
    }
    ,
    template: `
    <div class="modal-mask">
        <div class="modal-wrapper">
            <div class="modal-container">

                <div class="modal-header">
                        <h1>Edit Book </h1>
                </div>

                <div class="modal-body">
                    <form id="editform" v-on:submit.prevent="commitchanges">
                        <input type="text" name="book_name" v-model="book_name" class="form-control m-2" placeholder="Book Name" required>
                        <input type="text" name="section_name" v-model="section_name" class="form-control m-2" placeholder="Section Name" required>
                        <input type="text" name="book_author" v-model="book_author" class="form-control m-2" placeholder="Author" required>
                        <input type="number" name="book_price" v-model="book_price" class="form-control m-2" placeholder="Price" required>
                        <label for="book_image">Book Cover: PNG only.</label>
                        <input type="file" id="book_image" name="book_image" class="form-control m-2" placeholder="Image" accept=".png">
                        <button type="submit" class="btn btn-success m-2">Save Changes</button>
                    </form>
                </div>

                <div class="modal-footer">
                        <button class="modal-default-button" @click="$emit('close')">
                            Close without saving
                        </button>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        async commitchanges(submitEvent) {
            if (!confirm("Are you sure ?")) {
                return
            }
            const img = submitEvent.target.book_image.files[0];
            if (img === undefined) {
                fetch("/api/book/" + this.book.book_id, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        book_name: this.book_name,
                        book_author: this.book_author,
                        book_price: this.book_price,
                        book_rating: this.book.book_rating,
                        section_name: this.section_name
                    })
                }).then(response => {
                    if (response.status === 200) {
                        this.book.book_name = this.book_name
                        this.book.book_author = this.book_author
                        this.book.book_price = this.book_price
                        alert("Changes saved successfully. Reload the page to see changes in section of Book.")
                        this.$emit('close')
                    } else {
                        console.log(response)
                        alert('We are facing some technical issues. Please try again later.')
                    }
                })

            } else {
                const reader = new FileReader();
                reader.readAsDataURL(img);
                reader.onloadend = () => {
                    fetch("/api/book/" + this.book.book_id, {
                        method: "PUT",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            book_name: this.book_name,
                            book_author: this.book_author,
                            book_price: this.book_price,
                            book_rating: this.book.book_rating,
                            book_image: reader.result,
                            section_name: this.section_name
                        })
                    }).then(response => {
                        if (response.status === 200) {
                            this.book.book_name = this.book_name
                            this.book.book_author = this.book_author
                            this.book.book_price = this.book_price
                            alert("Changes saved successfully.")
                            this.$emit('close')
                        } else {
                            console.log(response)
                            alert('We are facing some technical issues. Please try again later.')
                        }
                    })
                }
            }
        }
    }
})

const sect = Vue.component("sect", {
    data() {
        return {
            showeditsectmodal: false,
            showaddbookmodal: false
        }
    },
    props: {
        section: Object
    },
    template: `
    <div>
        <h2>{{section.section_name}}</h2>
       <div class="d-flex justify-content-start">
        <a v-on:click="showeditsectmodal=true" class="btn btn-success m-2">Edit Section</a>
         <transition name="modal">
                <editsectmodal :section="section" v-if="showeditsectmodal" v-on:close="showeditsectmodal=false"></editsectmodal>
         </transition>
        <a v-on:click="showaddbookmodal=true" class="btn btn-primary m-2">Add Book</a>
        <transition name="modal">
                <addbookmodal :section_id="section.section_id" v-if="showaddbookmodal" v-on:close="showaddbookmodal=false"></addbookmodal>
        </transition>
        <a v-on:click="deletesect" class="btn btn-danger m-2">Delete Section</a>
      </div>
      <div class="row flex-nowrap col-12 overflow-auto py-2 px-3 my-3 mx-0">
      <div v-for="(bk, index) in section.books">
            <book :book="bk" :section_name="section.section_name"></book>
      </div>
      
    </div>
    </div>
    `,
    methods: {
        deletesect() {
            if (!confirm("Are you sure ?")) {
                return
            }

            if (!confirm("Are you really sure? This will delete all the books in this section!")) {
                return
            }

            fetch("/api/section/" + this.section.section_id, {
                method: "DELETE",
                body: {}
            }).then(response => {
                console.log(response.status)
                if (response.status === 200) {
                    this.$emit('close')
                    location.reload();
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const addbookmodal = Vue.component("addbookmodal", {
    props: {
        section_id: Number
    },
    data() {
        return {
            book_name: "",
            book_author: "",
            book_price: "",
            book_rating: 0
        }
    },
    template: `
    <div class="modal-mask">
        <div class="modal-wrapper">
            <div class="modal-container">

                <div class="modal-header">
                        <h1>Add Book </h1>
                </div>

                <div class="modal-body ">
                    <form id="addform" v-on:submit.prevent="addbook">
                        <input type="text" name="book_name" v-model="book_name" class="form-control m-2" placeholder="Book Name" required>
                        <input type="text" name="book_author" v-model="book_author" class="form-control m-2" placeholder="Author" required>
                        <input type="number" name="book_price" v-model="book_price" class="form-control m-2" placeholder="Price" required>
                        <label for="book_image">Book Cover: PNG only.</label>
                        <input type="file" id="book_image" name="book_image" class="form-control m-2" placeholder="Image" accept=".png"> 
                        <button type="submit" class="btn btn-success m-2">Add Book</button>
                    </form>
                </div>
                
                <div class="modal-footer">
                        <button class="modal-default-button" @click="$emit('close')">
                            Close without saving
                        </button>
                </div>
            </div>
        </div>
    </div>`,

    methods: {
        addbook(submitEvent) {
            if (!confirm("Are you sure ?")) {
                return
            }
            const img = submitEvent.target.book_image.files[0];
            if (img === undefined) {
                fetch("/api/addbook/" + this.section_id, {
                    method: "POST",
                    body: JSON.stringify({
                        'book_name': this.book_name,
                        'book_author': this.book_author,
                        'book_price': this.book_price,
                        'book_rating': this.book_rating
                    })
                }).then(response => {
                        if (response.status === 201) {
                            alert("Book added successfully.")
                            this.$emit('close')
                            location.reload()
                        } else {
                            alert('We are facing some technical issues. Please try again later.')
                        }
                    }
                )
            } else {
                const reader = new FileReader();
                reader.readAsDataURL(img);
                reader.onloadend = () => {
                    fetch("/api/addbook/" + this.section_id, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            book_name: this.book_name,
                            book_author: this.book_author,
                            book_price: this.book_price,
                            book_rating: this.book_rating,
                            book_image: reader.result
                        })
                    }).then(response => {
                        if (response.status === 201) {
                            alert("Book added successfully.")
                            this.$emit('close')
                            location.reload()
                        } else {
                            alert('We are facing some technical issues. Please try again later.')
                        }
                    })
                }
            }
        }
    }
})


const editsectmodal = Vue.component("editsectmodal", {
    props: {
        section: Object,
    },
    data() {
        return {
            section_name: this.section.section_name,
            section_description: this.section.section_description
        }
    }
    ,
    template: `
    <div class="modal-mask">
        <div class="modal-wrapper">
            <div class="modal-container">

                <div class="modal-header">
                        <h1>Edit Section </h1>
                </div>

                <div class="modal-body">
                    <form id="editform" v-on:submit.prevent="commitchanges">
                        <input type="text" name="section_name" v-model="section_name" class="form-control m-2" placeholder="Section Name" required>
                        <input type="text" name="section_description" v-model="section_description" class="form-control m-2" placeholder="Section Description" required>
                        <button type="submit" class="btn btn-success m-2">Save Changes</button>
                    </form>
                </div>

                <div class="modal-footer">
                        <button class="modal-default-button" @click="$emit('close')">
                            Close without saving
                        </button>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        async commitchanges(submitEvent) {
            if (!confirm("Are you sure ?")) {
                return
            }

            fetch("/api/section/" + this.section.section_id, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    section_name: this.section_name,
                    section_description: this.section_description
                })
            }).then(response => {
                if (response.status === 200) {
                    this.section.section_name = this.section_name
                    this.section.section_description = this.section_description
                    alert("Changes saved successfully. ")
                    this.$emit('close')
                } else {
                    console.log(response)
                    alert('We are facing some technical issues. Please try again later.')
                }
            })

        }
    }

})

const addsectmodal = Vue.component("addsectmodal", {
    data() {
        return {
            section_name: "",
            section_description: ""
        }
    },
    template: `
    <div class="modal-mask">
        <div class="modal-wrapper">
            <div class="modal-container">

                <div class="modal-header">
                        <h1>Add Section </h1>
                </div>

                <div class="modal-body ">
                    <form id="addform" v-on:submit.prevent="addsection">
                        <input type="text" name="section_name" v-model="section_name" class="form-control m-2" placeholder="Section Name">
                        <input type="text" name="section_description" v-model="section_description" class="form-control m-2" placeholder="Section Description">
                        <button type="submit" class="btn btn-success m-2">Add Section</button>
                    </form>
                </div>
                
                <div class="modal-footer">
                        <button class="modal-default-button" @click="$emit('close')">
                            Close without saving
                        </button>
                </div>
            </div>
        </div>
    </div>`,
    methods: {
        addsection(submitEvent) {
            if (!confirm("Are you sure ?")) {
                return
            }

            fetch("/api/addsection", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    section_name: this.section_name,
                    section_description: this.section_description
                })
            }).then(response => {
                if (response.status === 201) {
                    alert("Section added successfully. ")
                    this.$emit('close')
                    location.reload();
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const allbooks = Vue.component('allbooks', {
    data() {
        return {
            sections: [],
            showaddsectmodal: false
        }
    },
    template: `
    <div style="width:80vw; margin-left: auto; margin-right: auto;">
        <div v-for="(sec, index) in this.sections">
            <hr>
            <sect :section="sec"></sect>
        </div>
      <div class="row col-12 overflow-x-auto py-2 px-3">
         <a v-on:click='showaddsectmodal=true' class="btn btn-success m-2">Add New Section</a>
         <transition name="modal">
                <addsectmodal v-if="showaddsectmodal" v-on:close="showaddsectmodal=false"></addsectmodal>
         </transition>
      </div>
    </div>
    `,
    beforeCreate() {
        fetch("/api/everything").then(response => response.json()).then(data => {
            this.sections = data
        })
    }
})

const dateformatter = function (value) {
    if (value === null) {
        return null
    }
    return new Date(value).toLocaleString()
};

const requests = Vue.component('requests', {
    components: {
        'BootstrapTable': BootstrapTable
    },
    data() {
        return {
            approval_time: 7,
            pendingreqs: [],
            pendingreqscolumns: [
                {'checkbox': true},
                {title: 'Request ID', field: 'req_id', sortable: true},
                {title: 'Book Name', field: 'book_name', sortable: true},
                {title: 'Requested By', field: 'user_name', sortable: true},
                {title: 'Requested On', field: 'date_of_request', sortable: true, formatter: dateformatter}
            ],
            pendingreqsoptions: {
                search: true,
                showColumns: true,
                toggle: "table",
                sortName: 'date_of_request',
                sortOrder: 'asc',
            },
            activereqs: [],
            activereqscolumns: [
                {'checkbox': true},
                {title: 'Request ID', field: 'req_id', sortable: true},
                {title: 'Book Name', field: 'book_name', sortable: true},
                {title: 'Requested By', field: 'user_name', sortable: true},
                {title: 'Requested On', field: 'date_of_request', sortable: true, formatter: dateformatter},
                {title: 'Issued on', field: 'date_of_issue', sortable: true, formatter: dateformatter},
                {title: 'Due Date', field: 'due_date', sortable: true, formatter: dateformatter}
            ],
            activereqsoptions: {
                search: true,
                showColumns: true,
                toggle: "table"
            }
        }
    },
    template:
        `
<div style="width:80vw; margin-left: auto; margin-right: auto;">
    <h2 class="text-center">Requests Awaiting Approval</h2> 
    <div v-if="this.pendingreqs.length >0" class="d-flex justify-content-end">
        <div class="m-2">Approval Time: <input v-model="approval_time" type="number" min="1" max="100" width="50px"> days</div>
        <a class="btn btn-success m-2" @click="approve">Approve Selection</a>
        <a class="btn btn-danger m-2" @click="reject">Reject Selection</a>
    </div>
    <div v-if="this.pendingreqs.length >0" class="table-responsive">
     <bootstrap-table id="pendingreqstable" :columns="pendingreqscolumns" :data="pendingreqs" :options="pendingreqsoptions" class="table table-striped" data-thead-classes="thead-dark"></bootstrap-table>
    </div>
    <h4 style="color:gray" v-else class="text-center"> No requests Pending </h4>
    <hr>
    <h2 class="text-center">Active Requests</h2> 
    <div v-if="this.activereqs.length >0" class="d-flex justify-content-end">   
        <a class="btn btn-danger m-2" @click="revoke">Revoke Selection</a>
    </div>
    <div v-if="this.activereqs.length >0" class="table-responsive">
     <bootstrap-table id="activereqstable" :columns="activereqscolumns" :data="activereqs" :options="activereqsoptions" class="table table-striped" data-thead-classes="thead-dark"></bootstrap-table>
    </div>
    <h4 style="color:gray" v-else class="text-center"> No Active Requests </h4>
    </div>
    `
    ,
    beforeCreate() {
        fetch("/api/pendingreqs").then(response => response.json()).then(data => {
            this.pendingreqs = data
        })
        fetch("/api/activereqs").then(response => response.json()).then(data => {
            this.activereqs = data
        })
    }
    ,
    methods: {
        approve() {
            if (!confirm("Are you sure ?")) {
                return
            }
            const temp = $('#pendingreqstable').bootstrapTable('getSelections')
            fetch("/api/approve/" + this.approval_time, {
                method: "POST",
                body: JSON.stringify(temp)
            }).then(response => {
                console.log(response.status)
                if (response.status === 204) {
                    this.pendingreqs = this.pendingreqs.filter(function (x) {
                        for (let i = 0; i < temp.length; i++) {
                            let elem = temp[i];
                            if (elem.req_id === x.req_id) {
                                return false
                            }
                        }
                        return true
                    })
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
        ,
        reject() {
            if (!confirm("Are you sure ?")) {
                return
            }
            const temp = $('#pendingreqstable').bootstrapTable('getSelections')
            fetch("/api/reject", {
                method: "POST",
                body: JSON.stringify(temp)
            }).then(response => {
                console.log(response.status)
                if (response.status === 204) {
                    this.pendingreqs = this.pendingreqs.filter(function (x) {
                        for (let i = 0; i < temp.length; i++) {
                            let elem = temp[i];
                            if (elem.req_id === x.req_id) {
                                return false
                            }
                        }
                        return true
                    })
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        },
        revoke() {
            if (!confirm("Are you sure ?")) {
                return
            }
            const temp = $('#activereqstable').bootstrapTable('getSelections')
            fetch("/api/revoke", {
                method: "POST",
                body: JSON.stringify(temp)
            }).then(response => {
                console.log(response.status)
                if (response.status === 204) {
                    this.activereqs = this.activereqs.filter(function (x) {
                        for (let i = 0; i < temp.length; i++) {
                            let elem = temp[i];
                            if (elem.req_id === x.req_id) {
                                return false
                            }
                        }
                        return true
                    })
                } else {
                    alert('We are facing some technical issues. Please try again later.')
                }
            })
        }
    }
})

const routes = [{
    path: '/',
    component: allbooks
}, {
    path: '/requests',
    component: requests
},
    {
        path: '/stats',
        component: stats
    }]

const router = new VueRouter({routes})

const app = new Vue({
    el: '#app',
    router: router,
    delimiters: ['${', '}']
})
