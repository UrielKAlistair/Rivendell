export const search = Vue.component("search", {
    data: function () {
        return {
            searchResults: [],
            searchQuery: {"section_filter": null,
                          "rating_filter": null,
                          "price_filter": null,
                          "q": null}
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
    template: `<a>{{searchResults}}</a>
    `,
    watch:
    {
        $route(to, from) {
            this.searchQuery["q"] = to.query.q;
            fetch(`/api/search`, {
                method: "POST",
                body: JSON.stringify(this.searchQuery)
            }).then(response => response.json()).then(data => {
                this.searchResults = data
            })
        }
    }
})