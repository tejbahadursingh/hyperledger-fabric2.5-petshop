#!/bin/bash
echo "========== stopped containers =========="
docker ps -a --format 'CONTAINER ID : {{.ID}} | Name: {{.Names}}';
echo "========== starting containers =========="
#stoppedcontainers = `docker ps -aq`
#echo $stoppedcontainers
for i in $(docker ps -aq)
do 
	docker start $i
	sleep 1
	echo "started container :: " $i
done
