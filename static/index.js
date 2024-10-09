"use strict";

class LastUpdateUtil {
    #noteBooks;
    #dataList;

    constructor() {
        this.#noteBooks = new Map();
        this.#dataList = [];
    }

    loadData(callback) {
        this.#fetch({
            url: "/api/notebook/lsNotebooks",
            method: "POST",
            success: response => {
                console.debug(response);
                response.data.notebooks.forEach(notebook => {
                    this.#noteBooks.set(notebook.id, notebook.name);
                });

                this.#fetch({
                    url: "/api/query/sql",
                    method: "POST",
                    data: {
                        stmt: `SELECT * FROM blocks WHERE type = 'd' ORDER BY updated DESC LIMIT 15 OFFSET 0`
                    },
                    success: response => {
                        console.debug(response);
                        this.#handleResult(response);
                        callback(this.#dataList);
                    }
                });
            }
        });
    }

    clearData() {
        this.#noteBooks.clear();
        this.#dataList = [];
    }

    #handleResult(response) {
        const newData = response.data.map((item, _) => {
            const updated = item.updated;
            const year = updated.slice(0, 4);
            const month = updated.slice(4, 6);
            const day = updated.slice(6, 8);
            const hour = updated.slice(8, 10);
            const minute = updated.slice(10, 12);
            const dateKey = `${year}/${month}/${day} ${hour}:${minute}`;

            return {
                id: item.id,
                title: item.content,
                sub: this.#noteBooks.get(item.box) + item.hpath,
                date: dateKey,
            };
        });

        this.#dataList = this.#dataList.concat(newData);

        // newData.forEach((_, index) => this.processData(index, this.dataList, this.lengthLimit));
    }

    #fetch({ url, method, data, success }) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        };

        fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                success(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }

    // processData(index, data, lengthLimit) {
    //     const item = data[index];
    //     const query = `
    //     SELECT * FROM blocks 
    //     WHERE (root_id = '${item.id}') AND type = 'p' 
    //     AND updated >= '${item.updated.slice(0, 8)}000000' 
    //     AND updated <= '${item.updated.slice(0, 8)}235959'
    //   `;

    //     this.h({
    //         url: "/api/query/sql",
    //         method: "POST",
    //         data: { stmt: query },
    //         success: response => {
    //             const contentData = response.data;
    //             let content = "";
    //             for (const block of contentData) {
    //                 if (block.content.length > 0) {
    //                     let blockContent = block.content;
    //                     if (blockContent.length > lengthLimit) {
    //                         blockContent = blockContent.slice(0, lengthLimit) + "...";
    //                     }
    //                     content += blockContent + "\n";
    //                 }
    //             }
    //             data[index].content = content;
    //         }
    //     });
    // }
}

window.onload = () => {
    const data = new LastUpdateUtil();

    data.loadData(dataList => {
        const container = document.getElementById("container");
        container.innerHTML = "";
        dataList.forEach(item => {
            const li = document.createElement("li");
            li.className = "item";
            li.innerHTML = `
      <span class="date">${item.date}</span>
      <span> - </span>
      <span class="title">${item.title}</span>
    `;
            container.appendChild(li);
        });
    });

    setInterval(() => {
        data.clearData();
        data.loadData(dataList => {
            const container = document.getElementById("container");
            container.innerHTML = "";
            dataList.forEach(item => {
                const li = document.createElement("li");
                li.className = "item";
                li.innerHTML = `
          <span class="date">${item.date}</span>
          <span> - </span>
          <span class="title">${item.title}</span>
        `;
                container.appendChild(li);
            });
        });
    }, 60000);
}
