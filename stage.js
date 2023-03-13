window.OpenLP = {
    mode: "lyrics",
    modes: { lyrics: "lyrics", title: "title", footer: "footer" },
    show_images: true,
    websocket_port: 4317,

    connect: function () {
        let params = (new URL(document.location)).searchParams;
        OpenLP.mode = params.get("mode");
        if (!OpenLP.mode) {
            OpenLP.mode = OpenLP.modes.lyrics;
        }
        if (OpenLP.mode == OpenLP.modes.lyrics) {
            OpenLP.show_images = params.get("show_images");
        }

        const host = window.location.hostname;
        ws = new WebSocket(`ws://${host}:${OpenLP.websocket_port}`);
        ws.onmessage = (event) => {
            const reader = new FileReader();
            reader.onload = () => {
                data = JSON.parse(reader.result.toString()).results;
                if (data.blank || data.theme || data.display) {
                    switch (OpenLP.mode) {
                        case OpenLP.modes.lyrics:
                            OpenLP.currentSlide = -1;
                            break;
                        case OpenLP.modes.title:
                            OpenLP.currentTitle = "";
                            break;
                        case OpenLP.modes.footer:
                            OpenLP.currentFooter = [];
                            break;
                    }
                    OpenLP.update();
                }
                else if (OpenLP.currentItem != data.item || OpenLP.currentService != data.service) {
                    OpenLP.currentItem = data.item;
                    OpenLP.currentService = data.service;
                    OpenLP.load();
                }
                else if (OpenLP.currentSlide != data.slide) {
                    if (OpenLP.mode == OpenLP.modes.lyrics) {
                        OpenLP.currentSlide = parseInt(data.slide, 10);
                        OpenLP.update();
                    }
                }
            };

            reader.readAsText(event.data);
        };
    },

    load: function () {
        fetch('/api/v2/controller/live-items?_=' + Date.now())
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                switch (OpenLP.mode) {
                    case OpenLP.modes.lyrics:
                        OpenLP.currentSlides = data.slides;
                        OpenLP.currentSlide = 0;

                        OpenLP.currentSlides.forEach(function (slide, idx) {
                            if (slide["selected"])
                                OpenLP.currentSlide = idx;
                        });
                        break;
                    case OpenLP.modes.title:
                        OpenLP.currentTitle = data.title;
                        break;
                    case OpenLP.modes.footer:
                        OpenLP.currentFooter = data.footer;
                        break;
                }
                OpenLP.update();
            });
    },

    update: function () {
        let content = '';
        switch (OpenLP.mode) {
            case OpenLP.modes.lyrics:
                if (OpenLP.currentSlide > -1) {
                    if (OpenLP.currentSlides[OpenLP.currentSlide].img) {
                        if (OpenLP.show_images) {
                            content = "<img src='" + OpenLP.currentSlides[OpenLP.currentSlide].img + "'>";
                        }
                    } else {
                        let lines = OpenLP.currentSlides[OpenLP.currentSlide].text.split("\n");
                        lines.forEach(function (line, idx) {
                            content += '<p>' + line + '</p>';
                        });
                    }
                }
                break;
            case OpenLP.modes.title:
                content = OpenLP.currentTitle;
                break;
            case OpenLP.modes.footer:
                let lines = OpenLP.currentFooter;
                lines.forEach(function (line, idx) {
                    content += '<p>' + line + '</p>';
                });
                break;
        }

        document.getElementById('text').innerHTML = content;
    }
}

OpenLP.connect();