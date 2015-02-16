function init() {
    var storage,
        TODOS;

    var App = function(el, api) {

        var app = {

            init: function(el, api) {
                var _this = this;

                this.$el = el;
                this.todolists = [];

                storage.init(api, function() {
                    storage.addCalback(function() {
                        _this.state == 'priority-list' &&
                            _this._getPriorityList().render()
                    });
                    _this.render();

                    api.wait.elementRender('.todo.show', function(el) {
                        var id = el.attr('id').split('_')[1],
                            data = {};

                        data[id] = storage.get(id) || { priority: 0};

                        storage.add(data, function() { //Тут хотелось бы ускорить добавив
                            var todo = Todo(el, id, data[id].priority);
                            TODOS[id] = todo;

                            todo.render();

                            api.wait.elementRender(function() {
                                    return _this.$el.find('.todolist:not(.priority-sorted):not(.new):not(.copy_options)')
                                },
                                function(el) {
                                _this.todolists.push(Todolist(el));
                            });
                        });
                    });

                });

                return this;
            },

            _getControl: function() {
                if(!this._checkbox) {
                    this._checkbox = $('<div class="priority-sort" >' +
                          '<input type="checkbox" id="priority-sort"><label for="priority-sort">Sort by priority</label>' +
                    '</div>')
                }

                return this._checkbox;
            },

            _getPriorityList: function() {
                if(!this._priorityList)
                    this._priorityList = PriorityList($('<article class="todolist priority-sorted"><ul class="todos"></article>'));

                return this._priorityList
            },

            bindEvents: function() {
                var _this = this,
                    checkbox = this._getControl().find('input[type=checkbox]');

                checkbox.change(function() {
                    checkbox.is(':checked') ? _this.renderSorted() : _this.renderList();
                });
            },

            renderList: function() {
                this.todolists.forEach(function(todolist) {
                    todolist.render();
                });

                this.toggleTodoLists(false);
            },

            renderSorted: function () {
                this._getPriorityList().render();

                this.toggleTodoLists(true);
            },

            state: 'todolists',

            toggleTodoLists: function(prioritySorted){
                if(prioritySorted) {
                    this.todolists.forEach(function(todolist) {
                        todolist.toggle(false);
                    });
                    this._getPriorityList().toggle(true);
                    $('[data-behavior=new_todolist]').prop('disabled', true).addClass('new-todolist-disabled');
                    this.state = 'priority-list';
                } else {
                    this.todolists.forEach(function(todolist) {
                        todolist.toggle(true);
                    });
                    this._getPriorityList().toggle(false);
                    $('[data-behavior=new_todolist]').prop('disabled', false).removeClass('new-todolist-disabled');
                    this.state = 'todolists';
                }
            },

            render: function() {
                this._getControl().insertBefore(this.$el.find('.todolist:first'));
                this._getPriorityList().$el.insertBefore(this.$el.find('.todolist:first'));

                this.toggleTodoLists(false);
                this.bindEvents();
            }
        };

        return app.init(el, api);

    };

    var PriorityList = function($el) {
        var priorityList = {

            init: function($el) {
                this.$el = $el;

                return this;
            },

            toggle: function(show) {
                show ? this.$el.show() : this.$el.hide();
            },

            _sortFunction: function(a,b) {
                var first = a.getPriority() || 999,
                    second = b.getPriority() || 999; //Хак для вывода пустых приоритетов

                if (first > second) return 1;
                if (first < second) return -1;

                return 0;
            },

            _getTodos: function() {
                return Object.keys(TODOS).map(function(key) {
                    var todo = TODOS[key];

                    if(todo.model.completed) return;

                    todo.id = key;

                    return todo;
                });
            },

            _getTodosList: function() {
                if(!this._todosList) this._todosList = this.$el.find('.todos');
                return this._todosList;
            },

            render: function() {
                var todosList = this._getTodosList(),
                currentPriority;

                todosList.children().detach();

                this._getTodos()
                    .sort(this._sortFunction)
                    .forEach(function(todo) {
                        if(!todo) return;

                        var priority = todo.getPriority();

                        if(currentPriority != priority) {
                            currentPriority = priority;
                            todosList.append('<div class="priority-separator">Priority: ' + (priority || 'No') + '</div>');
                        }

                        todosList.append(todo.$el);

                    }, this);
            }
        };

        return priorityList.init($el);
    };

    var Todolist = function($el) {
        var todolist = {

            init: function($el) {
                var _this = this;

                this.$el = $el;
                this.todos = [];
                this.id = $el.attr('id').split('_')[1];

                this.$el.find('.todo.show').each(function(i, el) {
                    _this.todos.push($(el).attr('id').split('_')[1]);
                });

                return this;
            },

            _getTodosList: function() {
                if(!this._todosList) this._todosList = this.$el.find('.todos');
                return this._todosList;
            },

            toggle: function(show) {
                show ? this.$el.show() : this.$el.hide();
            },

            render: function() {
                this.todos.forEach(function(id) {
                    var todo = TODOS[id];

                    if(todo.model.completed) return;

                    this._getTodosList().append(todo.$el);
                }, this);

                this.toggle(true);
            }
        };

        return todolist.init($el);
    };

    var Todo = function($el, id) {

        var todo = {
            init: function($el, id) {
                this.$el = $el;
                this.id = id;

                this.model = storage.get(id);

                return this;
            },

            getPriority: function() {
                return this.model.priority;
            },

            _popup: $('<span class="balloon right_side expanded_content priority-baloon">')
                .append($('<span class="arrow">'))
                .append($('<span class="arrow">'))
                .append($('<label>Set priority</label>'))
                .append($('<div class="priority-select">(' +
                    [1,2,3].map(function(i) {
                        return '<a href="#" data-val="'+ i +'">' + i + '</a>'
                    }) +
                    ')' +
                    '<a href="#" data-val="0">x</a>' +
                '</div>')),

            _getBalloon: function() {
                var priority = this.getPriority();

                if(!priority) {
                    return $('<span>')
                        .attr({
                            class: 'pill has_balloon priority blank',
                            'data-behavior': 'hover_content expandable expand_exclusively',
                            'data-hovercontent-strategy': 'visibility'
                        })
                        .css({
                            visibility: 'hidden'
                        })
                        .append($('<a href="#" data-behavior="expand_on_click">').text('Set priority'))
                        .append(this._popup);

                } else {
                    return $('<span>')
                        .attr({
                            class: 'pill has_balloon priority',
                            'data-behavior': 'expandable expand_exclusively'
                        })
                        .append($('<a href="#" data-behavior="expand_on_click">').text('Priority: ' + priority))
                        .append(this._popup);
                }
            },

            bindEvents: function() {
                var completeCheckbox = $el.find('input[name=todo_complete]'),
                    _this = this,
                    id = this.id;

                completeCheckbox.change(function() {
                      storage.change(id, { completed: completeCheckbox.is(':checked') }, function() { });
                  }).trigger('change');

                  $el.find('.priority-baloon a').click(function(e) {
                      var $el = $(e.target);

                      e.preventDefault();

                      storage.change(id, { priority: $el.data('val') }, function() { _this.render() });
                  });
            },

            render: function() {
                var $el = this.$el;

                $el.find('.priority').remove();
                $el.find('.wrapper').append(this._getBalloon());

                this.bindEvents();
            }
        };

        return todo.init($el, id)
    };

    storage = {

        save: function(callback) {
            var _this = this;

            if(this._timeout) clearTimeout(this._timeout);

            this._timeout = setTimeout(function(){ _this._save() }, 100);
            callback();
        },

        _save: function() {
            this.storage.set('todos', this.todos, function() {});
        },

        add: function(todos, callback) {
            $.extend(todos || {}, this.todos);

            this.todos = todos;

            this.save(callback);
        },

        change: function(id, data, callback) {
            this.todos[id] = $.extend(this.todos[id], data);

            this._onChange();
            this.save(callback);
        },

        get: function(id) {

            return this.todos[id];
        },

        _callbacks: [],

        addCalback: function(callback) {
            this._callbacks.push(callback)
        },

        _onChange: function() {
            this._callbacks.forEach(function(callback) {
                setTimeout(callback, 0);
            });
        },

        init: function(api, callback) {
            var _this = this;

            this.storage = api.userData;

            this.storage.get('todos', function(error, data) {
                _this.todos = data || {};

                callback();
            });

            return this;
        }

    };

    return  {
        start: function(taistApi) {
            taistApi.wait.elementRender('section.todos', function(el) {
                TODOS = {};
                App(el, taistApi)
            });
        }
    };

}
