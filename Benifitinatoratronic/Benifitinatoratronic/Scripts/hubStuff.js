$(() => {
    // setup globals local storage because magic basically 
    var v = new Proxy({}, {
        get: (_, n) => {
            try {
                return $.parseJSON(localStorage.getItem(n));
            } catch (e) {
                return localStorage.getItem(n);
            }
        },
        set: (_, n, v) => localStorage.setItem(n, JSON.stringify(v))
    }),
        session = new Proxy({}, {
            get: (_, n) => {
                try {
                    return $.parseJSON(sessionStorage.getItem(n));
                } catch (e) {
                    return sessionStorage.getItem(n);
                }
            },
            set: (_, n, v) => sessionStorage.setItem(n, JSON.stringify(v))
        }),
    //the 'ol toolbox
    u = {
        enumerateFunction: (t) => { //dynamicaly execute up to 5 objects deep
            if (u.isEmpty(t)) return () => null;
            console.log("Executing: ", t);
            var p = t.split(".");
            switch (p.length) {
                case 1:
                    return u.rpo(p[0]);
                case 2:
                    return u.rpo(p[0])[p[1]];
                case 3:
                    return u.rpo(p[0])[p[1]][p[2]];
                case 4:
                    return u.rpo(p[0])[p[1]][p[2]][p[3]];
                case 5:
                    return u.rpo(p[0])[p[1]][p[2]][p[3]][p[4]];
                default:
                    return;
            }
        },
        rpo: (t) => {
            switch (t) {
                case "u":
                    return u;
                case "a":
                    return a;
                default:
            }
        },
        // hub stuff
        connection: $.connection,
        server: $.connection.mainHub.server,
        client: $.connection.mainHub.client,
        //usefull stuff
        isEmpty: (what) => (what == 0 || what == '' || what == null || what.length == 0),
        ifEmpty: (what, failover) => (u.isEmpty(what) ? failover || "" : what),
        contains: (array, search) => array.indexOf(search) >= 0,
        isVisible: (element) => $(element).is(":visible"),
        doCallback: (cb) => {
            if (typeof cb === "function") cb();
        },
        togglePanel: (panel, storage, focus, cb) => {
            $(panel).slideToggle(() => {
                var vis = u.isVisible(panel);
                v[storage] = vis;
                if (vis) $(focus).focus();
                u.doCallback(cb);
            });
        },
        getTimeElapsed: (started) => parseFloat((Date.now() - started) / 1000) + "s",
        getView: (path, target, cb) => {
            u.server.getView(path, null)
                .done((r) => {
                    console.log("getView: ", r);
                    var segment = path.split("/")[2];
                    history.pushState({ page: path }, segment, segment);
                    $(target).html(r.payload);
                    u.doCallback(cb);
                });
        },
        loadView: (view,cb) => {
            view = (u.isEmpty(view) ? "login" : view);
            $("div:first").fadeOut("slow", () => { 
                u.getView(`/views/${view}/index.cshtml`, "body", () => {
                    document.title = $(".page_title").text();
                    $("div:first").fadeIn("slow", () => {
                        u.enumerateFunction($("body").find("[data-load-event]").attr("data-load-event"))();
                        if (view != "login") {
                            $("body").append("<a href='/home' class='fa fa-home home-btn'/>");
                            $(".home-btn").fadeIn("slow");
                        }
                    });
                });
                u.doCallback(cb);
            });
        },
        getPerson: (prefix) => {
            return {
                FirstName: $(`.${prefix}_fname`).val(),
                LastName: $(`.${prefix}_lname`).val(),
                Email: $(`.${prefix}_email`).val(),
                Phone: $(`.${prefix}_phone`).val(),
                SSN: $(`.${prefix}_ssn`).val(),
                Address1: $(`.${ prefix }_address1`).val(),
                Address2: $(`.${prefix}_address2`).val(),
                City: $(`.${ prefix }_addresscity`).val(),
                State: $(`.${prefix}_addressstate`).val(),
                Zip: $(`.${ prefix }_addresszip`).val()
            };
        },
        renderPersonTable: (data, target) => {
            var output = "";
            $.each(data, (i, item) => {
                output += `<tr data-id="${(item.Parent == 0 ? item.Id : item.Parent)}">
                            <td>${item.FirstName} ${item.LastName}</td>
                            <td>${item.Email}</td>
                            <td>${item.Phone}</td>
                            <td style="text-align:center;">
                                <i class="btn btn-success fa fa-user-plus" data-click-event="a.addDependant"></i>
                                <i class="btn btn-info fa fa-info-circle" data-click-event="a.selectPerson"></i>
                            </td>
                          </tr>`;
            });
            $(target).html(output);
        }
    },
    //actions
    a = {
        startLogin: () => {
            u.getView("/views/login/index.cshtml", "body", () => {
                a.showLogin(); 
            });
        },
        showLogin: () => {
            $("h1:first").fadeIn("slow", () => {
                $("h1:first").fadeOut("slow", () => {
                    if (!u.isEmpty(session.username)) $("h1:last").html(`Welcome back ${session.username}!`);
                    $("h1:last").fadeIn("slow", () => {
                        $("h1:last").fadeOut("slow", () => {
                            if (u.isEmpty(session.username)) {
                                $(".login_panel").fadeIn("slow", () => {
                                    $(".login_username_input").focus();
                                });
                            }
                            else {
                                $(".login_username_input").val(session.username);
                                a.login();
                            }
                        });
                    });
                });
            });
        },
        login: (e) => {
            session.username = $(".login_username_input").val();
            u.server.hello(session.username)
                .done((r) => {
                    session.ConnectionId = r.payload;
                    $(".login_panel").fadeOut("slow", () => { 
                        u.getView("/views/home/index.cshtml", "body", () => {
                            $(".view_home").fadeIn("slow");
                        });
                    });
                });
        },
        getAddEmployee: (e) => {
            $(e.currentTarget).css("border", "1px solid green");
            u.loadView("addemployee");
        },
        savePerson: (options, cb) => {
            var person = u.getPerson(options.prefix);
            person.Type = options.type;
            person.parent = options.parent || 0;
            u.server.savePerson(person)
                .done((r) => {
                    u.doCallback(cb);
                });
        },
        saveEmployee: () => a.savePerson({ prefix: "add_emp", type: "Employee" }, () => u.loadView("home")),
        saveDependant: () => a.savePerson({ prefix: "add_dep", type: ($(".add_dep_spouse").is(":checked") ? "Spouse" : "Child"), parent: v.selectedPerson }, () => u.loadView("home")), 
        getSearchEmployee: (e) => u.loadView("searchemployee", () => u.server.getAllPeople("Employee").done((r) => {
            console.log(r);
            u.renderPersonTable(r.payload, "tbody");
        }).fail((r) => console.log(r))),
        getAddDepentant: (e) => u.loadView("adddependant"),
        addDependant: (e) => {
            v.selectedPerson = $(e.currentTarget).parent().parent().attr("data-id");
            u.loadView("adddependant");
        },
        loadAddDependantView: () => {
            u.server.searchForPersonById(v.selectedPerson)
            .done((r) => {
                console.log("emp: ", r);
                //$("[placeholder='First Name']").val(r.payload.FirstName);
                $("[placeholder='Last Name']").val(r.payload.LastName);
                $("[placeholder='Email']").val(r.payload.Email);
                $("[placeholder='Phone']").val(r.payload.Phone);
                $("[placeholder='SSN']").val(r.payload.SSN);
                $("[placeholder='Address']").val(r.payload.Address1);
                //$("[placeholder='']").val(r.payload.Address2);
                $("[placeholder='City']").val(r.payload.City);
                $("[placeholder='State']").val(r.payload.State);
                $("[placeholder='Zip']").val(r.payload.Zip);
                $(".page_title").append(` for ${r.payload.FirstName} ${r.payload.LastName}`);
            });
        },
        getSearchDependant: (e) => u.loadView("searchdependant", () => u.server.getAllPeople("Dependant").done((r) => {
            console.log(r);
            u.renderPersonTable(r.payload, "tbody");
        }).fail((r) => console.log(r))),
        setupSearch: () => $("[placeholder='Search']").focus(),
        searchEmployeeKeyup: (e) => {
            var searchTerm = $(e.currentTarget).val();
            if (v.keystrokeWorker || searchTerm.length < 3) return;
            v.keystrokeWorker = true;
            setTimeout(() => { a.searchForPerson(searchTerm,"Employee"); v.keystrokeWorker = false; }, 1000);
        },
        searchDependantKeyup: (e) => {
            var searchTerm = $(e.currentTarget).val();
            if (v.keystrokeWorker || searchTerm.length < 3) return;
            v.keystrokeWorker = true;
            setTimeout(() => { a.searchForPerson(searchTerm, "Dependant"); v.keystrokeWorker = false; }, 1000);
        },
        searchForPerson: (searchTerm, personType) => {
            u.server.searchForPerson(searchTerm, personType)
                .done((r) => u.renderPersonTable(r.payload,"tbody"));
        },
        selectPerson: (e) => {
            v.selectedPerson = $(e.currentTarget).parent().parent().attr("data-id");
            u.loadView("person");
        },
        populatePersonDetails: () => {
            u.server.getPersonDetails(v.selectedPerson)
                .done((r) => {
                    console.log("getPersonDetails: ", r);
                    $(".page_title").append(` for ${r.payload.Employee.FirstName} ${r.payload.Employee.LastName}`);
                    if (r.payload.Dependants.length == 0) $(".dependant-info").hide();
                    else $.each(r.payload.Dependants, (i, item) => $(".dependant-info").append(a.renderPersonInfo(item)));
                    $(".employee-info").append(a.renderPersonInfo(r.payload.Employee));
                    $(".person-info").fadeIn();
                    $(".pay-details tbody").html(`
                        <tr><td>Gross Income</td><td>$${(r.payload.Income).toFixed(2)}</td></tr>
                        <tr><td>Benefits</td><td>$${(r.payload.Benefits).toFixed(2)}</td></tr>
                        <tr><td>Discounts</td><td>$${(r.payload.Benefits - r.payload.Deductions).toFixed(2)}</td></tr>
                        <tr><td>Deductions</td><td>$${(r.payload.Deductions).toFixed(2)}</td></tr>
                        <tr><td>Net Income</td><td>$${(r.payload.Income - r.payload.Deductions).toFixed(2)}</td></tr>
                    `);
                    $(".pay-details table").fadeIn();
                });
        },
        renderPersonInfo: (person) => {
            return `<div class="person-info">
                        <i class="fa fa-user"/> ${person.FirstName} ${person.LastName}<br>
                        <i class="fa fa-users"/> ${person.Type}<br>
                        <i class="fa fa-envelope"/> <a href="mailto:${person.Email}">${person.Email}</a><br>
                        <i class="fa fa-phone"/> ${person.Phone}<br>
                    </div>`;
        },
        handlePopstate: (e) => {
            console.log("pagestate: ", e.state);
            if (u.isEmpty(session.username)) a.startLogin();
            u.getView(e.state.page, "body", () => {
                $("div:first").fadeIn("slow");
            });
        },
        init: () => {
            console.log("starting hub");
            //handlers
            u.client.hiEverybody = function (name, message) {
                var encodedName = $('<div />').text(name).html();
                var encodedMsg = $('<div />').text(message).html();
                $('#discussion').append('<li><strong>' + encodedName
                    + '</strong>:&nbsp;&nbsp;' + encodedMsg + '</li>');
            };
            u.connection.hub.start().done(() => {
                console.log("hub started");
                //handleState
                u.loadView(window.location.pathname.split("/").slice(-1)[0]);
            });
            
        }
    };
    //setup element based listeners for events
    $("body")
        .on("click", "[data-click-event]", (e) => u.enumerateFunction($(e.currentTarget).attr("data-click-event"))(e))
        .on("keyup", "[data-keyup-event]", (e) => u.enumerateFunction($(e.currentTarget).attr("data-keyup-event"))(e))
        .on("change", "[data-change-event]", (e) => u.enumerateFunction($(e.currentTarget).attr("data-change-event"))(e));
    window.onpopstate = (e) => a.handlePopstate(e);
    a.init();
});