// BehindTheSite - Dynamic Core Curriculum Database
// Isolated data layer for token-efficient rendering of micro-lessons and chapters.
// Aligned 100% with DataCamp's progressive, mastery-focused micro-lesson pedagogy.

export const CHAPTERS = [
  {
    id: 1,
    title: "Why Backend Exists",
    description: "Discover what happens behind the curtains of the web. Learn the absolute 'Why' before the 'How'.",
    lessons: [
      {
        id: "1.1",
        title: "Observe the Client-Server Split",
        type: "Observe",
        problem: "Observe how a Browser (Client) requests an index.html file from a Remote Server.",
        concept: "The browser (Client) runs entirely on your local computer. It handles rendering pixels (HTML/CSS) and capturing mouse clicks. The Backend (Server) is a remote, secure machine that processes logic, computes business calculations, and guards the database. When you open a website, a network transaction crosses the pipeline to retrieve the page.",
        activityType: "quiz",
        question: "Based on the client-server split, what is the main purpose of placing calculations on the remote Backend rather than local client-side Javascript?",
        options: [
          "To allow CSS layouts to render faster on smartphones",
          "To prevent local users from tempering, bypass validations, or reading private database credentials in the browser inspector",
          "To force the user's browser to execute code in the background",
          "To automatically update the local hard drive storage"
        ],
        correctAnswer: 1,
        hint: "Anyone can right-click any page in a browser and read, edit, or bypass client-side code. Backend code remains invisible and secure.",
        solution: "To prevent local users from altering operations or reading private keys in the browser inspector.",
        xp: 50
      },
      {
        id: "1.2",
        title: "Modify Dynamic Templates",
        type: "Modify",
        problem: "Tweak a server template configuration variable to dynamically change the response output.",
        concept: "A static website serves the exact same file to every visitor (like a digital billboard). A dynamic backend customized response reads inputs and generates custom outputs on the fly (like a personalized dashboard feed). Let's see how changing a variable updates the output.",
        activityType: "code",
        startingCode: "# Dynamic welcome controller\ndef generate_response(username, is_admin):\n    # TODO: Toggle is_admin to True or False to see how the response shifts\n    is_admin = False\n    \n    if is_admin:\n        return f\"Hello Admin {username}, welcome to BehindTheSite!\"\n    else:\n        return f\"Hello Student {username}, welcome to BehindTheSite!\"",
        validationRegex: "is_admin\\s*=\\s*True",
        validationCode: "def check(code):\n    return 'is_admin = True' in code.replace(' ', '')",
        correctCode: "# Dynamic welcome controller\ndef generate_response(username, is_admin):\n    is_admin = True\n    \n    if is_admin:\n        return f\"Hello Admin {username}, welcome to BehindTheSite!\"\n    else:\n        return f\"Hello Student {username}, welcome to BehindTheSite!\"",
        hint: "Locate line 4 and change 'is_admin = False' to 'is_admin = True' to modify the script state.",
        solution: "Toggle the boolean parameter to True to authorize admin-level logs.",
        xp: 60
      },
      {
        id: "1.3",
        title: "Build Dynamic Greetings",
        type: "Build",
        problem: "Construct a dynamic Python greeting function returning status-dependent client outputs.",
        concept: "Now that you've modified a parameter, it's time to build the branch. In Python, an `if-else` statement is the most basic tool used by servers to decide how to respond to incoming client payloads.",
        activityType: "code",
        startingCode: "# Complete the conditional response statement\ndef greet_user(name, status_code):\n    # TODO: If status_code is 'vip', return a premium welcome string\n    # Else return a standard welcome string\n    if status_code == \"____\":\n        return f\"Welcome VIP {name}!\"\n    else:\n        return f\"Welcome {name}!\"",
        validationRegex: "\"vip\"|'vip'",
        validationCode: "def check(code):\n    return 'vip' in code.lower()",
        correctCode: "# Complete the conditional response statement\ndef greet_user(name, status_code):\n    if status_code == \"vip\":\n        return f\"Welcome VIP {name}!\"\n    else:\n        return f\"Welcome {name}!\"",
        hint: "Fill the blank with the string literal \"vip\" to complete the equivalence assertion.",
        solution: "Compare status_code directly with the String 'vip'.",
        xp: 80
      },
      {
        id: "1.4",
        title: "Debug Disconnected Logic",
        type: "Debug",
        problem: "Find and patch the syntax glitch crashing our dynamic greets script.",
        concept: "One of the primary jobs of a backend developer is debugging crashes. A single syntax error (like a missing colon or bad indentation) halts the server, sending a 500 Server Error back to the client. Let's fix a broken script.",
        activityType: "code",
        startingCode: "# Debug the broken if statement below\ndef log_visit(username, visits):\n    # FIXME: Missing syntax parameters on line 5\n    if visits > 10\n        return f\"Loyal visitor {username} has logged in!\"\n    else:\n        return f\"{username} has logged in!\"",
        validationRegex: "if visits > 10:",
        validationCode: "def check(code):\n    return 'if visits > 10:' in code",
        correctCode: "# Debug the broken if statement below\ndef log_visit(username, visits):\n    if visits > 10:\n        return f\"Loyal visitor {username} has logged in!\"\n    else:\n        return f\"{username} has logged in!\"",
        hint: "Python `if` statements require a trailing colon `:` at the end of the line.",
        solution: "Append a colon to close the condition assertion block.",
        xp: 90
      },
      {
        id: "1.5",
        title: "Mastery Check: Server Security",
        type: "Mastery",
        problem: "Show absolute mastery of client-server logic boundaries by auditing product actions.",
        concept: "You have observed, modified, built, and debugged basic client-server logic. Let's complete your Chapter 1 graduation by passing the ultimate architectural inspection.",
        activityType: "quiz",
        question: "Imagine you are building a banking application. The frontend displays the account balances. Why MUST the actual balance calculations and bank transfers execute on the backend server?",
        options: [
          "Because smartphones do not have enough computing power to add or subtract bank balances",
          "To allow bank servers to cache transactions dynamically in local browser cookies",
          "Because any code running in the browser can be manipulated, allowing a malicious client to modify local JavaScript variable values to instantly credit millions of dollars to their balance",
          "To let CSS files validate transfer security protocols"
        ],
        correctAnswer: 2,
        hint: "Never trust the client. Any validation or math done on the frontend can be hacked by a user editing local browser data.",
        solution: "Because client-side parameters can be tampered with by the browser user.",
        xp: 100
      }
    ]
  },
  {
    id: 2,
    title: "How The Internet Works",
    description: "Master the invisible pipeline: DNS, IP addresses, HTTP headers, and the request-response lifecycle.",
    lessons: [
      {
        id: "2.1",
        title: "Observe IP Addresses",
        type: "Observe",
        problem: "Observe how machines route requests using numeric IP addresses.",
        concept: "Every computer connected to the internet has a unique label called an IP address (e.g. `142.250.190.46`). These numbers let routers deliver network packets to the correct server. Let's check how servers map IPs.",
        activityType: "quiz",
        question: "Why do we use IP addresses (like 192.168.1.1) in web transactions?",
        options: [
          "To design visual UI components",
          "To serve as distinct, unique addresses letting internet routers locate target servers across the globe",
          "To secure file storage paths in backend folders",
          "To compile Python script templates"
        ],
        correctAnswer: 1,
        hint: "Think of an IP address as a mailing address for a physical house.",
        solution: "To serve as precise, unique network identifiers allowing machines to route packets.",
        xp: 50
      },
      {
        id: "2.2",
        title: "Modify Domain Maps",
        type: "Modify",
        problem: "Change local DNS hosts variables to redirect domains dynamically.",
        concept: "The Domain Name System (DNS) maps human-readable domains (like `google.com`) to computer IPs (like `142.250.190.46`). Let's edit a DNS lookup script to route query entries.",
        activityType: "code",
        startingCode: "# Modify local DNS records list\ndef resolve_domain(domain_name):\n    # TODO: Change the mapping for 'behindthesite.com' to route to '10.0.0.99'\n    dns_phonebook = {\n        \"google.com\": \"142.250.190.46\",\n        \"behindthesite.com\": \"192.168.1.5\"\n    }\n    return dns_phonebook.get(domain_name, \"Domain not found\")",
        validationRegex: "\"behindthesite.com\"\\s*:\\s*\"10.0.0.99\"|'behindthesite.com'\\s*:\\s*'10.0.0.99'",
        validationCode: "def check(code):\n    return '10.0.0.99' in code",
        correctCode: "# Modify local DNS records list\ndef resolve_domain(domain_name):\n    dns_phonebook = {\n        \"google.com\": \"142.250.190.46\",\n        \"behindthesite.com\": \"10.0.0.99\"\n    }\n    return dns_phonebook.get(domain_name, \"Domain not found\")",
        hint: "Locate line 6 and change '192.168.1.5' to '10.0.0.99'.",
        solution: "Map the server's domain to redirect DNS queries to our local workspace.",
        xp: 60
      },
      {
        id: "2.3",
        title: "Build DNS lookup helpers",
        type: "Build",
        problem: "Build a Python mapping dictionary to resolve custom domain queries.",
        concept: "Now that you've modified mapping constants, build a routing dictionary. Dicts (`{key: value}`) in Python are the exact data structures backends use to hold simple key-value maps.",
        activityType: "code",
        startingCode: "# Build lookup dictionary containing system endpoints\ndef query_dns(domain):\n    # TODO: Add a routing entry inside the resolver dict:\n    # Map the key 'api.behindthesite.com' to '8.8.8.8'\n    resolver = {\n        \"google.com\": \"142.250.190.46\",\n        \"____\": \"____\"\n    }\n    return resolver.get(domain, \"DNS_ERROR\")",
        validationRegex: "\"api.behindthesite.com\"|'api.behindthesite.com'",
        validationCode: "def check(code):\n    return 'api.behindthesite.com' in code and '8.8.8.8' in code",
        correctCode: "# Build lookup dictionary containing system endpoints\ndef query_dns(domain):\n    resolver = {\n        \"google.com\": \"142.250.190.46\",\n        \"api.behindthesite.com\": \"8.8.8.8\"\n    }\n    return resolver.get(domain, \"DNS_ERROR\")",
        hint: "Fill the first blank with 'api.behindthesite.com' and the second with the IP '8.8.8.8'.",
        solution: "Complete the key-value pair inside the python dictionary.",
        xp: 80
      },
      {
        id: "2.4",
        title: "Debug Lookup Failures",
        type: "Debug",
        problem: "Find and patch spelling issues crashing our domain query scripts.",
        concept: "When writing dictionary resolvers, missing domain definitions will cause crashes unless we safe-query using `.get()`. Let's fix a DNS resolver that throws exceptions on missing entries.",
        activityType: "code",
        startingCode: "# Debug the dangerous dictionary access crash below\ndef resolve_safe(dns_map, domain_query):\n    # FIXME: Querying raw dictionary keys directly with dns_map[domain_query] throws crashes!\n    # Replace it with a safe lookup using dns_map.get(domain_query, \"0.0.0.0\")\n    return dns_map[domain_query]",
        validationRegex: "dns_map.get\\(domain_query,\\s*[\"']0.0.0.0[\"']\\)",
        validationCode: "def check(code):\n    return '.get(' in code and '0.0.0.0' in code",
        correctCode: "# Debug the dangerous dictionary access crash below\ndef resolve_safe(dns_map, domain_query):\n    return dns_map.get(domain_query, \"0.0.0.0\")",
        hint: "Use .get() on the dictionary, passing the query variable as the first argument, and the backup IP '0.0.0.0' as the second.",
        solution: "Use the dictionary .get() method to securely query key maps without throwing KeyErrors.",
        xp: 90
      },
      {
        id: "2.5",
        title: "Mastery Check: Status Code Dispatcher",
        type: "Mastery",
        problem: "Handle HTTP transaction statuses dynamically depending on route outcomes.",
        concept: "HTTP requests tell servers *what* to do. The server responds with status flags: 2xx means success, 4xx means client errors, and 5xx means server crashes. Let's build a secure HTTP response status code engine.",
        activityType: "code",
        startingCode: "# Construct response code based on file presence\ndef build_http_response(is_file_found, is_authorized):\n    # TODO: Return status integer 200 if file is found and authorized\n    # Return 401 if unauthorized\n    # Return 404 if not found\n    if not is_file_found:\n        return ____\n    if not is_authorized:\n        return ____\n    return 200",
        validationRegex: "404.*401|401.*404",
        validationCode: "def check(code):\n    return '404' in code and '401' in code",
        correctCode: "# Construct response code based on file presence\ndef build_http_response(is_file_found, is_authorized):\n    if not is_file_found:\n        return 404\n    if not is_authorized:\n        return 401\n    return 200",
        hint: "Fill the first blank (missing file) with 404, and the second (unauthorized access) with 401.",
        solution: "Evaluate boolean flags and dispatch the corresponding standard HTTP status integers.",
        xp: 100
      }
    ]
  },
  {
    id: 3,
    title: "APIs & Endpoints",
    description: "Build endpoints, process query parameters, and handle HTTP methods professionally.",
    lessons: [
      {
        id: "3.1",
        title: "Observe RESTful Endpoints",
        type: "Observe",
        problem: "Understand REST API routes and endpoint formats.",
        concept: "An API is a collection of endpoints (URLs) that frontend scripts call to retrieve or send data. REST is a standard convention where URL paths represent resources (nouns like `/users` or `/products`). Let's inspect these paths.",
        activityType: "quiz",
        question: "Following REST standards, which of the following endpoint URLs is correctly structured to manage a list of books in an digital library catalog?",
        options: [
          "https://api.site.com/getBooksNowAndSortThemByAuthor",
          "https://api.site.com/books",
          "https://api.site.com/run_command_to_fetch_books",
          "https://api.site.com/db/columns/books/data.csv"
        ],
        correctAnswer: 1,
        hint: "REST endpoints should represent resource collections as simple, clean nouns (like '/books' or '/users') rather than verbs or actions.",
        solution: "Use clean plural nouns (/books) as resources in REST structures.",
        xp: 50
      },
      {
        id: "3.2",
        title: "Modify Path Returns",
        type: "Modify",
        problem: "Tweak JSON payload structures returned by your endpoint controller.",
        concept: "Backend endpoints speak in JSON (JavaScript Object Notation). A route controller is a simple Python function that formats a dictionary which the framework serializes to JSON. Let's modify a dictionary output.",
        activityType: "code",
        startingCode: "# Modify JSON key maps\ndef get_book_details(book_id):\n    # TODO: Add a key called 'availability' mapped to the boolean status True\n    details = {\n        \"id\": book_id,\n        \"title\": \"Behind The Site Architecture Book\"\n    }\n    return details",
        validationRegex: "[\"']availability[\"']\\s*:\\s*True",
        validationCode: "def check(code):\n    return 'availability' in code and 'True' in code",
        correctCode: "# Modify JSON key maps\ndef get_book_details(book_id):\n    details = {\n        \"id\": book_id,\n        \"title\": \"Behind The Site Architecture Book\",\n        \"availability\": True\n    }\n    return details",
        hint: "Add a third row key '\"availability\": True' inside the details dictionary.",
        solution: "Insert the new key-value pair to modify our JSON response signature.",
        xp: 60
      },
      {
        id: "3.3",
        title: "Build Route Structures",
        type: "Build",
        problem: "Build a Python dictionary route router mapping paths to functions.",
        concept: "Modern backend frameworks map URL paths directly to controllers using a registry. Let's build a simple custom route dispatcher that maps path strings to Python function blocks.",
        activityType: "code",
        startingCode: "# Dispatch actions by mapping endpoints to handler functions\ndef fetch_users_list():\n    return [\"Chris\", \"Alex\"]\n\ndef handle_routing(endpoint_path):\n    # TODO: Map the string '/users' to the function fetch_users_list\n    routes_registry = {\n        \"/health\": lambda: \"OK\",\n        \"____\": ____\n    }\n    handler = routes_registry.get(endpoint_path)\n    if handler:\n        return handler()\n    return \"404_NOT_FOUND\"",
        validationRegex: "\"/users\"\\s*:\\s*fetch_users_list",
        validationCode: "def check(code):\n    return '/users' in code and 'fetch_users_list' in code",
        correctCode: "# Dispatch actions by mapping endpoints to handler functions\ndef fetch_users_list():\n    return [\"Chris\", \"Alex\"]\n\ndef handle_routing(endpoint_path):\n    routes_registry = {\n        \"/health\": lambda: \"OK\",\n        \"/users\": fetch_users_list\n    }\n    handler = routes_registry.get(endpoint_path)\n    if handler:\n        return handler()\n    return \"404_NOT_FOUND\"",
        hint: "Fill the first blank with '/users' and the second with the function variable name fetch_users_list (without parentheses).",
        solution: "Register the endpoint string and link it directly to the execution controller.",
        xp: 80
      },
      {
        id: "3.4",
        title: "Debug Route Collisions",
        type: "Debug",
        problem: "Find and patch endpoint collision conflicts return duplicate 404 responses.",
        concept: "When registering routes, matching parameters must be structured carefully so that static routes do not collide with dynamic ones. Let's fix a broken string routing dispatcher.",
        activityType: "code",
        startingCode: "# Debug circular route registry matching below\ndef resolve_api_path(path_string):\n    # FIXME: The root slash was stripped, causing '/users' lookup to fail!\n    # Remove the .replace('/', '') so the query retains the slash characters.\n    clean_query = path_string.replace(\"/\", \"\")\n    \n    routes = {\n        \"/users\": \"All users profile\",\n        \"/orders\": \"All orders listing\"\n    }\n    return routes.get(path_string, \"API_PATH_NOT_FOUND\")",
        validationRegex: "clean_query\\s*=\\s*path_string",
        validationCode: "def check(code):\n    return 'replace' not in code or 'clean_query = path_string' in code",
        correctCode: "# Debug circular route registry matching below\ndef resolve_api_path(path_string):\n    clean_query = path_string\n    \n    routes = {\n        \"/users\": \"All users profile\",\n        \"/orders\": \"All orders listing\"\n    }\n    return routes.get(path_string, \"API_PATH_NOT_FOUND\")",
        hint: "Change the line 'clean_query = path_string.replace(\"/\", \"\")' to simply 'clean_query = path_string' to preserve the slash.",
        solution: "Remove the character replacement to avoid circular endpoint mutations.",
        xp: 90
      },
      {
        id: "3.5",
        title: "Mastery Check: GET Query Processor",
        type: "Mastery",
        problem: "Filter data records in real-time based on incoming GET query parameters.",
        concept: "GET requests read resources. Queries like `/products?limit=2` tell the backend to restrict outputs. Let's build a complete python list filter mapping query constraints.",
        activityType: "code",
        startingCode: "# Filter lists using query variables\ndef search_products(products_list, query_limit):\n    # TODO: Return only the products up to the query_limit count\n    # In Python, you can slice a list with list[:limit]\n    if query_limit is None:\n        return products_list\n    return products_list[____:____]",
        validationRegex: ":query_limit",
        validationCode: "def check(code):\n    return ':query_limit' in code.replace(' ', '')",
        correctCode: "# Filter lists using query variables\ndef search_products(products_list, query_limit):\n    if query_limit is None:\n        return products_list\n    return products_list[:query_limit]",
        hint: "Python slice notation to take elements from start up to limit is '[:query_limit]'.",
        solution: "Apply python slicing to dynamically filter product response arrays.",
        xp: 100
      }
    ]
  },
  {
    id: 8,
    title: "Professional Project Structure",
    description: "Segregate routes, controllers, services, repositories, schemas, models, and configs.",
    lessons: [
      {
        id: "8.1",
        title: "Observe Layer Separation",
        type: "Observe",
        problem: "Match modular project file architectures inside our drag-and-drop sandbox.",
        concept: "Professional backend folders avoid huge files. We split operations into distinct files: `/routes` handles routing, `/controllers` handles parameters, `/services` manages calculations, `/models` structures DB columns, and `.env` stores secret credentials. Open our drag-and-drop board to check.",
        activityType: "sandbox",
        sandbox: {
          instructions: "Arrange the modular backend files in their correct professional architectural folders. To succeed, pair the correct file definition with its matching target directory.",
          files: [
            { id: "routes", name: "routes.py", desc: "Maps HTTP paths to controllers" },
            { id: "models", name: "models.py", desc: "Defines SQL database tables" },
            { id: "services", name: "services.py", desc: "Contains dynamic math logic" },
            { id: "env", name: ".env", desc: "Stores AI secret credentials" }
          ],
          folders: [
            { id: "api", name: "api/routes/", hint: "Holds endpoint path strings" },
            { id: "db", name: "database/models/", hint: "Saves table column schemas" },
            { id: "logic", name: "services/logic/", hint: "Manages core calculations" },
            { id: "secrets", name: "config/secrets/", hint: "Keeps private API keys secure" }
          ],
          correctAssignments: {
            "routes": "api",
            "models": "db",
            "services": "logic",
            "env": "secrets"
          }
        },
        hint: "routes.py maps paths (goes to api/routes/), models.py defines tables (goes to database/models/), services.py manages logic (goes to services/logic/), and .env maps private variables (config/secrets/).",
        solution: "Match each backend layer to its dedicated structural module.",
        xp: 100
      }
    ]
  }
];
