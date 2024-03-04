import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import webbrowser

HandlerClass = SimpleHTTPRequestHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"

if sys.argv[1:]:
    port = int(sys.argv[1])
else:
    port = 8787
# server_address = ('127.0.0.1', port)
# server_address = ('donglaix.perception.cs.cmu.edu', port)
server_address = ('gpuserver2.perception.cs.cmu.edu', port)

webbrowser.open('http://127.0.0.1:8787/local_viewer.html')

HandlerClass.protocol_version = Protocol
httpd = ServerClass(server_address, HandlerClass)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."
httpd.serve_forever()
