function init() {
    var storage,
        cache = {};

    var App = function(api) {

        var app = {

            init: function(api) {
                var _this = this;

                this.api = api;
                this.$el = $('section.todos');
                this.todolists = [];

                this.render();

                storage.init(api, this.parse(), function() {
                    renderPriorities();

                    api.wait.elementRender('.todo:not(.processed)', function() {
                        storage.add(_this.parse(), renderPriorities);
                    });

                });

                return this;
            },

            parse: function() {
                var _this = this,
                    todolists = this.$el.find('article.todolist:not(.new):not(.priority-sorted)'),
                    todos = {};

                    todolists.each(function(i, el) {
                        var todolist = Todolist($(el));

                        _this.todolists.push(todolist);

                        $.extend(todos, todolist.parse());
                    });

                return todos;
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
                if(!this._priorityList) this._priorityList = PriorityList();
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
                $('.todo').sort(function(a,b) {
                    //var first = storage.get($(a).attr('id')).priority,
                    //    second = storage.get($(b).attr('id')).priority;
                    //
                    //if (first < second) return 1;
                    //if (first > second) return -1;

                    return 0;
                }).appendTo('.todolist.priority-sorted .todos');
                this.toggleTodoLists(true);
            },

            toggleTodoLists: function(prioritySorted){
                if(prioritySorted) {
                    this.todolists.forEach(function(todolist) {
                        todolist.toggle(false);
                    });
                    $('[data-behavior=new_todolist]').prop('disabled', true).addClass('new-todolist-disabled');
                } else {
                    $('.todolist:not(.priority-sorted)').show();
                    $('[data-behavior=new_todolist]').prop('disabled', false).removeClass('new-todolist-disabled');
                }
            },

            render: function() {
                $('.todolists')
                    .prepend(this._getControl())
                    .prepend('<article class="todolist priority-sorted"><ul class="todos"></article>');

                this.bindEvents();
            }
        };

        return app.init(api);

    };

    var Todolist = function($el) {
        var todolist = {

            init: function($el) {
                this.$el = $el;
                this.todos = [];
                this.id = $el.attr('id').split('_')[1];

                $el.find('.todo').each(function(i) {
                });

                return this;
            },

            parse: function() {
                var _this = this,
                    todos = {};

                this.$el.find('.todo').each(function(i, el) {
                    var $el = $(el),
                        todoId = $el.attr('id').split('_')[1];

                    _this.todos.push(todoId);
                    cache[todoId] = $el; //немного ускоряющий костыль
                    todos[todoId] = ({ priority: 0, todolist: _this.id });

                });

                return todos;
            },

            toggle: function(show) {
                show ? this.$el.show() : this.$el.hide();
            },

            render: function() {
                this.todos.forEach(function(todoId) {
                    this.$el.find('.todos').append(cache[todoId]);
                }, this);

                this.toggle(true);
            }
        };

        return todolist.init($el);
    };

    function renderPriorities() {

        Object.keys(cache).forEach(function(id) {
            var todo = storage.get(id),
                $el = cache[id],
                balloon,
                popup = $('<span class="balloon right_side expanded_content priority-baloon">')
                    .append($('<span class="arrow">'))
                    .append($('<span class="arrow">'))
                    .append($('<label>Set priority</label>'))
                    .append($('<div class="priority-select">(' +
                        [1,2,3].map(function(i) {
                            return '<a href="#" data-id="' + id + '" data-val="'+ i +'">' + i + '</a>'
                        }) +
                    ')</div>'));


            if(!todo.priority) {
                balloon = $('<span>')
                    .attr({
                        class: 'pill has_balloon priority blank',
                        'data-behavior': 'hover_content expandable expand_exclusively',
                        'data-hovercontent-strategy': 'visibility'
                    })
                    .css({
                        visibility: 'hidden'
                    })
                    .append($('<a href="#" data-behavior="expand_on_click">').text('Set priority'))
                    .append(popup);

            } else {
                balloon = $('<span>')
                    .attr({
                        class: 'pill has_balloon priority',
                        'data-behavior': 'expandable expand_exclusively'
                    })
                    .append($('<a href="#" data-behavior="expand_on_click">').text('Priority: ' + todo.priority))
                    .append(popup);
            }

            $el.find('.priority').remove();
            $el.find('.wrapper').append(balloon);
            $el.data({ 'id': id });
        });

        $('.priority-baloon a').click(function(e) {
            var $el = $(e.target);

            e.preventDefault();

            storage.change($el.data('id'), $el.data('val'), renderPriorities);
        });

        $('.todo').addClass('processed');

    }

    storage = {

        save: function(callback) {
            this.storage.set('todos', this.todos, callback);
        },

        add: function(todos, callback) {
            $.extend(todos, this.todos);

            this.todos = todos;

            this.save(callback);
        },

        change: function(id, priority, callback) {
            this.todos[id].priority = priority;

            this.save(callback);
        },

        get: function(id) {

            return this.todos[id];
        },

        init: function(api, todos, callback) {
            var _this = this;

            this.storage = api.userData;

            this.storage.get('todos', function(error, data) {
                _this.todos = data || {};
                _this.add(todos, callback);
            });

            return this;
        }

    };

    return  {
        start: function(taistApi) {
            App(taistApi);

        }
    };

}
