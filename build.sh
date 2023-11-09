rm out/*
for file in client center; 
do 
# 	for target in windows linux
# 	do
# pkg throws many errors for me but the builds do work
	pkg $file.js --output out/$file --targets node18-linux-x64,node18-win-x64 
		# nexe -i $file.js -o out/$file-$target -t $target-x86-18.18.2 --build
	# done
done