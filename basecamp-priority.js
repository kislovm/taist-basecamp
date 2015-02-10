function init() {
    var storage,
        cache = {};


    function init(api) {
        storage.init(api, parse(), render);

    }

    function parse() {
        var todolists = $('article.todolist:not(.new)'),
            todos = {};

        if(todolists.length) {
            todolists.each(function(i, el) {
                var $el = $(el),
                    todolistId = $el.attr('id').split('_')[1];

                $el.find('.todo').each(function(i, el) {
                    var $el = $(el),
                        todoId = $el.attr('id').split('_')[1];

                    cache[todoId] = $el; //сильно ускоряющий костыль

                    todos[todoId] = ({ priority: 0, todolist: todolistId });
                });

            });
        }

        return todos;
    }

    function render() {

        Object.keys(cache).forEach(function(id) {
            var todo = storage.get(id),
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
                    .append(popup)

            } else {
                balloon = $('<span>')
                    .attr({
                        class: 'pill has_balloon priority',
                        'data-behavior': 'expandable'
                    })
                    .append($('<a href="#" data-behavior="expand_on_click">').text('Priority: ' + todo.priority))
                    .append(popup);
            }

            cache[id].find('.priority').remove();
            cache[id].find('.wrapper').append(balloon);
        });

        $('.priority-baloon a').click(function(e) {
            var $el = $(e.target);

            e.preventDefault();

            storage.change($el.data('id'), $el.data('val'), render);
        })
    }

    storage = {

        save: function(callback) {

            this.storage.set('todos', this.todos, callback);
        },

        add: function(todos, callback) {
            $.extend(todos, this.todos);

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
            init(taistApi);

        }
    };

}
