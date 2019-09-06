FactoryBot.define do

  # factory :cluster do
  #   sequence(:name) { |i| "Cluster_#{i}" }

  #   transient do
  #     node_count 2
  #   end

  #   after(:build) do |cluster, evaluator|
  #     evaluator.node_count.times { cluster.cluster_details << build(:cluster_detail, cluster: cluster) }
  #   end

  #   after(:create) do |cluster|
  #     cluster.cluster_details.each { |detail| detail.save! }
  #   end
  # end

  # factory :invalid_cluster, parent: :cluster do
  #   name ""
  # end

end
