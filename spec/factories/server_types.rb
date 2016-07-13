FactoryGirl.define do

  factory :server_type do
    sequence(:name) { |i| "ServType_#{i}" }

    transient do
      details_count 3
    end

    after(:build) do |server_type, evaluator|
      server_type.template_server_details << build_list(:template_server_detail, evaluator.details_count, server_type:
        server_type, server_part: create(:server_part), count: rand(1..10))
    end

    after(:create) do |server_type|
      server_type.template_server_details.each { |detail| detail.save! }
    end

  end

  factory :invalid_server_type, parent: :server_type do
    name ""
  end

end
