Hence
=====

Hence is a stack-oriented toy programming language with an expressive plain
English syntax.

### Example ###

```
duplicate
  _dup

multiply
  [...]

print_number
  _echon, [then] _echo "\n"

[ x -- x*x ]
square
  duplicate, [and] multiply

main
  [calculate] square [of] 9, [then] print_number
```

### Coming Soon ###

* Basic features
