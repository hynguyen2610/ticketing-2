package main

import (
	"fmt"
	"log"

	"github.com/nats-io/nats.go"
)

func main() {
	// Connect to NATS server
	nc, err := nats.Connect("nats://localhost:31478")
	if err != nil {
		log.Fatal("Error connecting to NATS: ", err)
	}
	defer nc.Close()

	// Define the queue group name
	// queueGroupName := "ticket-service-1"

	// Subscribe to a subject and specify the queue group
	_, err = nc.QueueSubscribe("ticket:created", func(m *nats.Msg) {
		// Handle the message
		fmt.Printf("Received message: %s\n", string(m.Data))
	})

	if err != nil {
		log.Fatal("Error subscribing to subject: ", err)
	}

	// Keep the program running to continue receiving messages
	select {}
}
