export const search = Vue.component("search", {
    data: function () {
        return {
            searchResults: [],
            searchQuery: {"section_filter": null,
                          "rating_filter": null,
                          "price_filter": null,
                          "q": null},
            sections: []
        }
    },
    beforeMount() {
        if (this.$route.query.q !== undefined) {
            this.searchQuery["q"] = this.$route.query.q;
            fetch(`/api/search`, {
                method: "POST",
                body: JSON.stringify(this.searchQuery)
            }).then(response => response.json()).then(data => {
                this.searchResults = data
            })
        }
    },
    watch:
    {
        $route(to, from) {
            window.history.pushState({}, '', '/#/search?q='+to.query.q)
            this.searchQuery["q"] = to.query.q;
            fetch(`/api/search`, {
                method: "POST",
                body: JSON.stringify(this.searchQuery)
            }).then(response => response.json()).then(data => {
                this.searchResults = data
            })
        }
    },
    template:`
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-2">
                <div class="card">
                    <div class="card-header">
                        Filters
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="sectionFilter">Section</label>
                            <input type="text" class="form-control" id="sectionFilter" v-model="searchQuery.section_filter">
                        </div>
                        <div class="form-group">
                            <label for="ratingFilter">Rating</label>
                            <input type="number" class="form-control" id="ratingFilter" v-model="searchQuery.rating_filter">
                        </div>
                        <div class="form-group">
                            <label for="priceFilter">Price</label>
                            <input type="number" class="form-control" id="priceFilter" v-model="searchQuery.price_filter">
                        </div>
                        <button class="btn btn-primary">Search</button>
                    </div>
                </div>
                <div style="border-left: 1px solid rgba(0,0,0,0.1); height: 100vh;
                    position: absolute; left: 100%; top: 0;"></div>
            </div>
            
            <div class="col-md-10">
                <div v-if="searchResults.length" class="row overflow-auto py-2 px-3 my-3 mx-0">
                    <div v-for="book in searchResults">
                        <book :book="book"></book>
                    </div>
                </div>
                <div v-else>
                    <p>No results found.</p>
                </div>
            </div>
        </div>
    </div>
    `
})