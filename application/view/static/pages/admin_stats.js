export const stats = Vue.component('stats', {
    // fetch from adminstats post req
    data() {
        return {
            active_user_count: 0,
            total_user_count: 0,
            active_req_count: 0,
            genre_counts: {},
            genres: [],
            selected_genre: "Fiction",
            added_genres: [],
            genre_line_data: {labels: [], datasets: []},
            myChart: null,
            lineDays: 0
        }
    },
    mounted() {
        fetch("/adminstats", {method: "POST", body: {}}).then(response => response.json()).then(data => {
            this.active_user_count = data.active_user_count
            this.total_user_count = data.total_user_count
            this.active_req_count = data.active_req_count
            this.genre_counts = data.genre_counts
            return 0;
        }).then(() => {
            const ctx = document.getElementById('GenrePie');
            new Chart(ctx, {
                type: 'doughnut',
                data: this.genre_counts
            })
            const userchart = document.getElementById('UserPie')
            new Chart(userchart, {
                type: 'doughnut',
                data: {
                    labels: ['Active Users', 'Inactive Users'],
                    datasets: [{
                        label: 'Number of users',
                        data: [this.active_user_count, this.total_user_count - this.active_user_count]
                    }]
                }
            })
            const genreline = document.getElementById('GenreLine')
            this.myChart = new Chart(genreline, {
                type: 'line',
                data: this.genre_line_data
            })
            this.lineDays = 10
            this.addGenre("Fiction")
        })
        fetch("/api/sections").then(response => response.json()).then(data => {
            let section;
            for (section of data) {
                this.genres.push(section.section_name)
            }
        })
    },
    template: `
<div class="row justify-evenly">
    <div class="col-md-4 mb-5" style="height:40vh">
      <h2>Active Users</h2>
      <canvas id="UserPie"></canvas>
    </div>
    <div class="col-md-4 mb-5" style="height:40vh">
      <h2>Popular Genres</h2>
      <canvas id="GenrePie"></canvas>
    </div>
    <div class="col-md-10 ml-2" style="height:50vh">
        <h2 style="text-align: center;">Genres over Time</h2>
        <p>Fetch Data for past
            <input type="number" v-model="lineDays" min="1" max="30">
            Days
        </p>
        <form @submit.prevent="addselectedGenre">
            <select v-model="selected_genre">
                <option v-for="genre in genres" :value="{genre}">{{genre}}</option>               
            </select>
            <button type="submit">Add Genre</button>
        </form>
        <canvas id="GenreLine"></canvas>
        <ul>
            <li v-for="genre in added_genres">{{genre}} <button @click="removeGenre(genre)">Remove</button></li>
        </ul>
        
    </div>
</div>
`,
    methods: {
        addselectedGenre() {
            let genre;
            for(genre of this.added_genres){
                if(genre === this.selected_genre["genre"]){
                    return;
                }
            }
            this.addGenre(this.selected_genre["genre"])
        },
        addGenre(newGenre) {
            const formData = new FormData();
            formData.append("genre", newGenre)
            formData.append("days", this.lineDays)

            fetch("getgenrestats", {
                method: "POST",
                body: formData
            }).then(response => {
                if (response.ok) {
                    return response.json()
                }
                throw new Error("Failed to fetch genre stats")
            }).then(data => {
                this.added_genres.push(newGenre)
                this.genre_line_data.datasets.push({label: newGenre, data: data, borderColor:this.randomColour()})
                this.myChart.update()
            })
        },
        removeGenre(genre) {
            this.added_genres = this.added_genres.filter(item => item !== genre)
            this.genre_line_data.datasets = this.genre_line_data.datasets.filter(item => item.label !== genre)
            this.myChart.update()
        },
        randomColour() {
            let r = Math.floor(Math.random() * 255);
            let g = Math.floor(Math.random() * 255);
            let b = Math.floor(Math.random() * 255);
            return "rgb(" + r + "," + g + "," + b + ")";
         }
    },
    watch: {
        lineDays(newVal, oldVal) {
            let genre;
            for (genre of this.added_genres) {
                this.removeGenre(genre);
                this.addGenre(genre);
            }
            const date = new Date();
            for (let i = oldVal; i < newVal; i++) {
                this.genre_line_data["labels"].unshift(`${date.getDate()}-${date.getMonth() + 1}`)
                date.setDate(date.getDate() - 1);
            }
        }
    }
})