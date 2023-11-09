# SMPP_CLI

### A small application used to create SMPP clients or centers. Serves as both the SMSC and ESME.

(Taken from the help page)

---

```
CLI SMPP (Client)

Options

  --help                  Display this usage guide.
  -h, --host string       The host (IP) to connect to.
  -p, --port number       The port to connect to.
  -s, --systemid string   SMPP related login info.
  -w, --password string   SMPP related login info.
  --sessions number       Number of sessions to start, defaults to 1.
  --messagecount number   Number of messages to send; Optional, defaults to 1.
  --window number         Defines the amount of messages that are allowed to be
                          'in flight'. The client no longer waits for a
                          response before sending the next message for up to
                          <window> messages. Defaults to 100.
  --windowsleep number    Defines the amount time (in ms) waited between
                          retrying in the case of full window. Defaults to 100.
  --mps number            Number of messages to send per second
  --source string         Source field of the sent messages.
  --destination string    Destination field of the sent messages.
  --message string        Text content of the sent messages.
  --debug                 Display all traffic to and from the client; Debug
                          mode.
```
---
```
CLI SMPP (Center)

Options

  --help                  Display this usage guide.
  -p, --port number       The port to connect to.
  -s, --systemid string   SMPP related login info.
  -w, --password string   SMPP related login info.
  --dr                    Whether or not to send Delivery Reports.
  --sessions number       Maximum number of client sessions to accept, defaults
                          to 8.
  --messagecount number   Number of messages to send; Optional, defaults to 0.
  --window number         Defines the amount of messages that are allowed to be
                          'in flight'. The client no longer waits for a
                          response before sending the next message for up to
                          <window> messages. Defaults to 100.
  --windowsleep number    Defines the amount time (in ms) waited between
                          retrying in the case of full window. Defaults to 100.
  --mps number            Number of messages to send per second
  --source string         Source field of the sent messages.
  --destination string    Destination field of the sent messages.
  --message string        Text content of the sent messages.
  --debug                 Display all traffic to and from the center; Debug
                          mode.
```
---
#### Center example usage:
```
./center-win.exe \
--port 7001 \
--systemid test \
--password test \
--sessions 10
```
Running this command will spawn an SMPP center (SMSC) which will:
- Start listening on 7001
- Accept clients with test:test credentials
- Allow up to a maximum of 10 sessions
#### Client example usage:
```
./client-win.exe \
--host localhost \
--port 7001 \
--systemid test \
--password test \
--window 5 \
--windowsleep 100 \
--messagecount 10000 \
--mps 10 \
--sessions 10
```
Running this command will spawn an SMPP client (ESME) which will:
- Try to connect 10 sessions to localhost:7001
- Once connected try to bind using test:test
- Once bound send 10000 messages at a rate of 10 per second and a window size of 5
- If the window is filled during sending the session will wait 100ms before attempting send again
---
---
#### Center example usage (sending):
```
./center-win.exe \
--port 7001 \
--systemid test \
--password test \
--window 5 \
--windowsleep 100 \
--messagecount 10000 \
--mps 10 \
--sessions 10
```
Running this command will spawn an SMPP center (SMSC) which will:
- Start listening on 7001
- Accept clients with test:test credentials
- Allow up to a maximum of 10 sessions
- Once a client is connected start sending 10000 messages at a rate of 10 per second with a window size of 5
- If the window is filled during sending the session will wait 100ms before attempting send again
---
