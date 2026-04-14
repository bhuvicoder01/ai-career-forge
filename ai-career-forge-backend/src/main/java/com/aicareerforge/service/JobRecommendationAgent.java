package com.aicareerforge.service;

import com.aicareerforge.model.Job;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobRecommendationAgent {

    private final VectorStore vectorStore;
    private final MongoTemplate mongoTemplate;
    private final ChatClient chatClient;

    public void clearVectorStore() {
        log.info("Purging all job listings from vector store...");
        Query query = new Query(Criteria.where("metadata.type").is("job_listing"));
        mongoTemplate.remove(query, "vector_store");
    }

    public void indexJob(Job job) {
        log.info("Indexing job in vector store: {} (ID: {})", job.getTitle(), job.getId());
        // Create a searchable representation of the job
        String content = "Title: " + job.getTitle() + 
                        "\nCompany: " + job.getCompany() + 
                        "\nDescription: " + job.getDescription();
        
        Document document = new Document(job.getId(), content, Map.of(
            "jobId", job.getId(),
            "type", "job_listing"
        ));
        
        vectorStore.add(List.of(document));
    }

    public List<Document> searchSimilarJobs(String userProfileText) {
        log.info("Searching for similar jobs in vector store with threshold 0.1...");
        if (userProfileText == null || userProfileText.isBlank()) {
            log.warn("Search text is empty.");
            return List.of();
        }

        // Perform similarity search
        SearchRequest searchRequest = SearchRequest.query(userProfileText)
                .withTopK(20)
                .withSimilarityThreshold(0.1); 
                
        List<Document> results = vectorStore.similaritySearch(searchRequest);
        log.info("Vector store returned {} results.", results.size());
        return results;
    }

    public String generateRelevanceExplanation(Job job, String userProfileText) {
        log.info("Generating relevance explanation for job: {}", job.getTitle());
        String prompt = String.format("""
                SYSTEM: You are a career advisor.
                USER: Explain in one or two short sentences why the following job is a good match for the candidate based on their profile.
                Focus on skill alignment and career growth.
                
                Candidate Profile: %s
                Job Title: %s
                Job Description Snippet: %s
                """, 
                userProfileText.substring(0, Math.min(userProfileText.length(), 1000)),
                job.getTitle(),
                job.getDescription().substring(0, Math.min(job.getDescription().length(), 500)));

        return chatClient.prompt().user(prompt).call().content();
    }
}
