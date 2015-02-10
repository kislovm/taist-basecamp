function init() {
    var storage,
        cache = {};


    function init(api) {
        storage.init(api, parse(), render);

    }

    function parse() {
        var todolists = $('.todolist:not(.new)'),
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
                balloon;


            if(!todo.priority) {
                balloon = $('<span>')
                    .attr({
                        class: 'pill has-balloon priority blank',
                        'data-behavior': 'hover_content expandable',
                        'data-hovercontent-strategy': 'visibility'
                    })
                    .css({
                        visibility: 'hidden'
                    })
                    .text('Set priority');
            } else {
                balloon = $('<span>')
                    .attr({
                        class: 'pill has-balloon priority',
                        'data-behavior': 'expandable'
                    })
                    .text('Priority: ' + todo.priority);
            }

            cache[id].find('.wrapper').append(balloon);
        });
    }

    storage = {

        save: function(callback) {

            this.storage.set('todos', this.todos, callback);
        },

        add: function(todos, callback) {
            $.extend(this.todos, todos);

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
