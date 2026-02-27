package com.noemare.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NoemareApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(NoemareApiApplication.class, args);
	}

}
