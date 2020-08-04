import websocket
import json
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd



global candles

def main(data):
  print (data)


def on_open(ws):
  json_data = json.dumps({"ticks_history": "R_50",
                            "adjust_start_time": 1,
                            "count": 5,
                            "end": "latest",
                            "start": 1,
                            "style": "candles"})
  ws.send(json_data)

def on_message(ws, message):
  print("DADO BRUTO -----------------------")
  json_data = json.loads(message)
  candles = json_data['candles']
  ws.close()
  


if __name__ == "__main__":
  apiUrl = "wss://ws.binaryws.com/websockets/v3?app_id=22566"
  ws = websocket.WebSocketApp(apiUrl, on_message = on_message, on_open = on_open)
  ws.keep_running = False
  ws.run_forever()
  main(candles)





  