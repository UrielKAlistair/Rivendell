import {navbar} from "../components/navbar.js";
import {allbooks} from "./user_home.js";
import {mybooks} from "./user_books.js";
import {mystats} from "./user_stats.js";
import {search} from "./search.js";
import {purchase} from "./user_payment.js";

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
        path: '/purchase/:id',
        component: purchase,
        props: true
    },{
        path: '/search',
        component: search
    }]

const router = new VueRouter({routes})

const app = new Vue({
    el: '#app',
    router: router,
    delimiters: ['${', '}']
})


