# make up             -> connect phone over Wi-Fi, start Metro, open the app in Expo Go
# make up PHONE=x.x.x.x  if the phone's IP changes
PHONE ?= 192.168.2.1
DEV := $(PHONE):5555

.PHONY: up
up:
	@usb=$$(adb devices | awk 'NR>1 && $$2=="device" && $$1 !~ /[:.]/ {print $$1; exit}'); \
	if [ -n "$$usb" ]; then echo "USB phone found, switching it to Wi-Fi on port 5555"; adb -s $$usb tcpip 5555 && sleep 3; fi
	@adb connect $(DEV) | grep -q connected || { \
	  echo "Phone not reachable at $(DEV). On your phone, check:"; \
	  echo "  1. It is on the same Wi-Fi as this laptop"; \
	  echo "  2. Settings > System > Developer options > Wireless debugging is ON"; \
	  echo "  3. Still failing? Plug in the USB cable and run make up again"; \
	  echo "  (phone IP changed? make up PHONE=192.168.2.x, shown on the Wireless debugging screen)"; \
	  exit 1; }
	adb -s $(DEV) reverse tcp:8081 tcp:8081
	@(timeout 120 sh -c 'until curl -sf localhost:8081/status >/dev/null; do sleep 1; done' && \
	  adb -s $(DEV) shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent >/dev/null) &
	npx expo start --localhost
