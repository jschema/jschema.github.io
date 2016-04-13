# Create js repository if it doesn't exist
if [ ! -d "js" ]; then
	mkdir js
fi
cd js

# Clone the jschema-tools repository
git clone -b master git@github.com:jschema/jschema-tools.git ./jschema-tools -q

# Temporary, this block should be removed before release
cd jschema-tools
git checkout javascript -q
cd ..

# Update jschema_to_java.js
if [ -f "jschema_to_java.js" ]; then
	rm jschema_to_java.js
fi
cp jschema-tools/src/main/resources/js/jschema_to_java.js ./jschema_to_java.js

# Update jschema_to_javascript.js
if [ -f "jschema_to_javascript.js" ]; then
	rm jschema_to_javascript.js
fi
cp jschema-tools/src/main/resources/js/jschema_to_javascript.js ./jschema_to_javascript.js

# Update json_to_jschema.js
if [ -f "json_to_jschema.js" ]; then
	rm json_to_jschema.js
fi
cp jschema-tools/src/main/resources/js/json_to_jschema.js ./json_to_jschema.js

# Remove the tools repo
rm -rf jschema-tools

# Print a nice message
printf "\nAll done! Check the \`js\` directory for the required Javascript tools.\n\n"