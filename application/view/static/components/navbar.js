export const navbar = {
    props: {
        username: String,
        isloggedin: Boolean,
    },
    data: function () {
        return {
            search_query: ""
        }
    }
    ,
    template: `
    <nav class="py-2.5 fixed flex row justify-content-between align-items-center navbar navbar-expand-lg navbar-light" style="background: #EAF4F3;height: 10vh; width: 100vw; margin: 0">
        <div class="image-container align-items-center d-flex h-100 mx-3">
          <img src="static/images/title.png" alt="site name" class="img-fluid">
          <img src="static/images/logo.jpeg" alt="Website Logo" class="img-fluid h-100">
        </div>

        <form @submit.prevent="handleSubmit" class="form-inline flex row col-md-4 align-items-center justify-contents-center">
          <input
            type="search"
            name="q"
            v-model="search_query"
            placeholder="Search"
            class="form-control mr-sm-2 px-3 py-1.5 text-black bg-transparent border border-gray-300 focus:border-primary focus:outline-none w-75"
          />
        
        <button type="submit" class="btn btn-outline-primary my-2 my-sm-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
        </button>
        
        </form>

        <div class="flex items-center row align-items-center">
        
          <div class="flex row align-items-center mr-3">
            <div v-for="(link, index) in this.navigationLinks" :key="index">
                <RouterLink :to="link.href" class="nav-link mx-2">{{ link.text }}</RouterLink>
            </div>
          </div>

          <div class="flex row items-center">
            <div v-if="!isloggedin">
              <a href="/login" class="btn btn-primary mx-3">Login</a>
            </div>
            <div v-else class="flex row items-center">
              <div class="text-gray-700 mx-2 my-2">Welcome, {{ username }}</div>
              <a href="/logout" class="btn btn-primary mx-3" style="margin-right: 2rem !important;">Logout</a>
            </div>
          </div>
        </div> 
    </nav>
    `,
    methods:{
        handleSubmit(){
            window.location.replace('/#/search?q='+this.search_query)
        }
    }
}
