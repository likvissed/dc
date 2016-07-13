FactoryGirl.define do

  factory :node_role do
    sequence(:name) { |i| "Node_#{i}" }
  end

  factory :invalid_node_role, parent: :node_role do
    name ""
  end

end
