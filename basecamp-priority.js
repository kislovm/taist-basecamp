function init() {
    var storage,
        cache = {};

    var App = function(api) {

        var app = {

            init: function(api) {
                this.api = api;
                this.$el = $('section.todos');

                initialRender();

                storage.init(api, this.parse(), function() {
                    renderPriorities();

                    api.wait.elementRender('.todo:not(.processed)', function() {
                        storage.add(this.parse(), renderPriorities);
                    });

                });

                return this;
            },

            parse: function() {
                var todolists = this.$el.find('article.todolist:not(.new):not(.priority-sorted)'),
                    todos = {};

                if(todolists.length) {
                    todolists.each(function(i, el) {
                        var $el = $(el),
                            todolistId = $el.attr('id').split('_')[1];

                        $el.find('.todo').each(function(i, el) {
                            var $el = $(el),
                                todoId = $el.attr('id').split('_')[1];

                            cache[todoId] = $el; //немного ускоряющий костыль
                            todos[todoId] = ({ priority: 0, todolist: todolistId });
                        });

                    });
                }

                return todos;
            }
        };

        return app.init(api);

    };

    var Todo = function() {

        var todo = {

            init: function() {

            }
        };

        return this.init();
    };



    function initialRender() {
        var checkbox;


        $('.todolists')
            .prepend('<div class="priority-sort" >' +
                '<input type="checkbox" id="priority-sort"><label for="priority-sort">Sort by priority</label>' +
            '</div>')
            .prepend('<article class="todolist priority-sorted"><ul class="todos"></article>');

        checkbox = $('#priority-sort');

        checkbox.change(function() {
            checkbox.is(':checked') ? renderSorted() : renderList();
        });
    }

    function renderList() {
        $('.todo').each(function (i, el) {
            var $el = $(el);

            $('.todolist[id=todolist_'+ storage.get($el.data('id')).todolist +'] .todos').append($el);
        });
        toggleTodoLists(false);
    }

    function renderSorted() {
        $('.todo').sort(function(a,b) {
            var first = storage.get($(a).data('id')).priority,
                second = storage.get($(b).data('id')).priority;

            if (first < second) return 1;
            if (first > second) return -1;

            return 0;
        }).appendTo('.todolist.priority-sorted .todos');
        toggleTodoLists(true);
    }

    function toggleTodoLists(prioritySorted) {
        if(prioritySorted) {
            $('.todolist:not(.priority-sorted)').hide();
            $('[data-behavior=new_todolist]').prop('disabled', true).addClass('new-todolist-disabled');
        } else {
            $('.todolist:not(.priority-sorted)').show();
            $('[data-behavior=new_todolist]').prop('disabled', false).removeClass('new-todolist-disabled');
        }
    }

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
